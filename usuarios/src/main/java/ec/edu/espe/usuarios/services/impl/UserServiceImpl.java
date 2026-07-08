package ec.edu.espe.usuarios.services.impl;

import ec.edu.espe.usuarios.dto.request.UserCreateRequest;
import ec.edu.espe.usuarios.dto.response.PersonResponse;
import ec.edu.espe.usuarios.dto.response.UserResponse;
import ec.edu.espe.usuarios.entity.*;
import ec.edu.espe.usuarios.repository.PersonRepository;
import ec.edu.espe.usuarios.repository.RoleRepository;
import ec.edu.espe.usuarios.repository.UserRepository;
import ec.edu.espe.usuarios.repository.UserRoleRepository;
import ec.edu.espe.usuarios.services.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PersonRepository personRepository;
    private final UserRoleRepository userRoleRepository;
    private final RoleRepository roleRepository;

    @Override
    public UserResponse createUser(UserCreateRequest request) {
        // Validar campos obligatorios
        validateRequiredFields(request);

        // Unicidad
        if (personRepository.existsByEmail(request.getEmail()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists");
        if (personRepository.existsByDni(request.getDni()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "DNI already exists");

        Person person = Person.builder()
                .dni(request.getDni())
                .firstName(request.getFirstName())
                .middleName(request.getMiddleName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .address(request.getAddress())
                .nationality(request.getNationality())
                .active(true)
                .build();

        person = personRepository.save(person);

        User user = User.builder()
                .person(person)
                .username(generarUsername(person.getFirstName(), person.getMiddleName(), person.getLastName()))
                .passwordHash(request.getDni()) // contraseña inicial = DNI
                .active(true)
                .build();

        user = userRepository.save(user);

        return mapToUserResponse(user);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> getUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToUserResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserById(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        return mapToUserResponse(user);
    }

    @Override
    public UserResponse updateUser(UUID id, UserCreateRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        Person person = user.getPerson();

        // Actualizar solo campos no nulos
        if (request.getDni() != null && !request.getDni().isEmpty()) {
            // Verificar unicidad de DNI (excepto el mismo)
            if (!person.getDni().equals(request.getDni()) && personRepository.existsByDni(request.getDni())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "DNI already exists");
            }
            person.setDni(request.getDni());
        }
        if (request.getFirstName() != null && !request.getFirstName().isEmpty()) {
            person.setFirstName(request.getFirstName());
        }
        if (request.getMiddleName() != null) {
            person.setMiddleName(request.getMiddleName());
        }
        if (request.getLastName() != null && !request.getLastName().isEmpty()) {
            person.setLastName(request.getLastName());
        }
        if (request.getEmail() != null && !request.getEmail().isEmpty()) {
            // Verificar unicidad de email
            if (!person.getEmail().equals(request.getEmail()) && personRepository.existsByEmail(request.getEmail())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists");
            }
            person.setEmail(request.getEmail());
        }
        if (request.getPhone() != null && !request.getPhone().isEmpty()) {
            person.setPhone(request.getPhone());
        }
        if (request.getAddress() != null) {
            person.setAddress(request.getAddress());
        }
        if (request.getNationality() != null && !request.getNationality().isEmpty()) {
            person.setNationality(request.getNationality());
        }

        person.setUpdatedAt(LocalDateTime.now());
        person = personRepository.save(person);

        // Actualizar también el usuario (por ejemplo, si se cambia el DNI, la
        // contraseña podría actualizarse, pero no lo hacemos)
        // Podríamos permitir cambiar estado activo mediante un campo booleano, pero no
        // está en el DTO.
        // Si se quiere desactivar, se usa el método deleteUser.

        user.setUpdatedAt(LocalDateTime.now());
        user = userRepository.save(user);

        return mapToUserResponse(user);
    }

    @Override
    public void deleteUser(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        // Desactivar lógicamente
        user.setActive(false);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        // También desactivar la persona (opcional)
        Person person = user.getPerson();
        person.setActive(false);
        person.setUpdatedAt(LocalDateTime.now());
        personRepository.save(person);
    }

    @Override
    public UserResponse assignRole(UUID userId, UUID roleId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Role not found"));

        // Verificar si ya tiene el rol activo
        if (userRoleRepository.existsByUserIdAndRoleId(userId, roleId)) {
            // Si existe pero está inactivo, lo reactivamos
            UserRole userRole = userRoleRepository.findByUserIdAndRoleId(userId, roleId)
                    .orElseThrow(
                            () -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Unexpected error"));
            if (!userRole.getActive()) {
                userRole.setActive(true);
                userRole.setUpdatedAt(LocalDateTime.now());
                userRoleRepository.save(userRole);
                return mapToUserResponse(user);
            } else {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Role already assigned to user");
            }
        }

        UserRoleId userRoleId = new UserRoleId(userId, roleId);
        UserRole userRole = UserRole.builder()
                .id(userRoleId)
                .user(user)
                .role(role)
                .active(true)
                .build();

        userRoleRepository.save(userRole);
        return mapToUserResponse(user);
    }

    @Override
    public UserResponse removeRoleFromUser(UUID userId, UUID roleId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        UserRole userRole = userRoleRepository.findByUserIdAndRoleId(userId, roleId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Role not assigned to user"));

        if (!userRole.getActive()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Role already removed");
        }

        userRole.setActive(false);
        userRole.setUpdatedAt(LocalDateTime.now());
        userRoleRepository.save(userRole);

        return mapToUserResponse(user);
    }

    // --------------------- MÉTODOS PRIVADOS ---------------------

    private void validateRequiredFields(UserCreateRequest request) {
        if (request.getDni() == null || request.getDni().isEmpty())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "DNI is required");
        if (request.getFirstName() == null || request.getFirstName().isEmpty())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "First name is required");
        if (request.getLastName() == null || request.getLastName().isEmpty())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Last name is required");
        if (request.getEmail() == null || request.getEmail().isEmpty())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required");
        if (request.getPhone() == null || request.getPhone().isEmpty())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Phone is required");
        if (request.getNationality() == null || request.getNationality().isEmpty())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nationality is required");
    }

    private String generarUsername(String firstName, String middleName, String lastName) {
        // Ejemplo: Kevin Francisco Quimuña Pilataxi -> kfquimunap
        // Manejar casos donde middleName sea null o vacío
        String fn = firstName.toLowerCase();
        String mn = (middleName != null && !middleName.isEmpty()) ? middleName.toLowerCase() : "";
        String[] lastParts = lastName.toLowerCase().split(" ");
        String base;
        if (lastParts.length >= 2) {
            base = fn.charAt(0) + (mn.isEmpty() ? "" : String.valueOf(mn.charAt(0))) + lastParts[0]
                    + lastParts[1].charAt(0);
        } else {
            base = fn.charAt(0) + (mn.isEmpty() ? "" : String.valueOf(mn.charAt(0))) + lastParts[0];
        }

        // Verificar si ya existe un username similar
        List<User> usersWithBase = userRepository.findByPartialUsername(base);
        if (!usersWithBase.isEmpty()) {
            int count = usersWithBase.size();
            base += (count + 1);
        }
        return base.toLowerCase();
    }

    private UserResponse mapToUserResponse(User user) {
        List<String> roles = user.getUserRoles().stream()
                .filter(UserRole::getActive)
                .map(ur -> ur.getRole().getName())
                .collect(Collectors.toList());

        Person person = user.getPerson();
        PersonResponse personResponse = PersonResponse.builder()
                .id(person.getId())
                .dni(person.getDni())
                .firstName(person.getFirstName())
                .middleName(person.getMiddleName())
                .lastName(person.getLastName())
                .email(person.getEmail())
                .phone(person.getPhone())
                .address(person.getAddress())
                .nationality(person.getNationality())
                .active(person.getActive())
                .build();

        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .active(user.getActive())
                .lastLogin(user.getLastLogin())
                .createdAt(user.getCreatedAt())
                .person(personResponse)
                .roles(roles)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserByDni(String dni) {
        // Buscar la persona por DNI
        Person person = personRepository.findByDni(dni)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Persona con DNI " + dni + " no encontrada"));

        // Buscar el usuario asociado a esa persona (el ID de usuario es el mismo que el
        // de persona)
        User user = userRepository.findById(person.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Usuario no encontrado para el DNI " + dni));

        return mapToUserResponse(user);
    }
}