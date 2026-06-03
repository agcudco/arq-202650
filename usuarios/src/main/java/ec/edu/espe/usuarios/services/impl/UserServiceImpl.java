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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PersonRepository personRepository;

    private final UserRoleRepository userRoleRepository;

    @Autowired
    private RoleRepository roleRepository;


    @Override
    public UserResponse createUser(UserCreateRequest userRequest) {
        //validaciones de unicidad
        if (personRepository.existsByEmail(userRequest.getEmail()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El email ya existe");
        if (personRepository.existsByDni(userRequest.getDni()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El dni ya existe");

        Person person = Person.builder()
                .dni(userRequest.getDni())
                .middleName(userRequest.getMiddleName())
                .lastName(userRequest.getLastName())
                .email(userRequest.getEmail())
                .phone(userRequest.getPhone())
                .address(userRequest.getAddress())
                .nationality(userRequest.getNationality())
                .firstName(userRequest.getFirstName())
                .build();

        person = personRepository.save(person);

        User user = User.builder()
                //.id(person.getId())
                .person(person)
                .username(generarUsername(person.getFirstName(), person.getMiddleName(), person.getLastName()))
                .passwordHash(userRequest.getDni())
                .build();

        user = userRepository.save(user);

        return mapToUserResponse(user);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> getUsers() {
        return userRepository.findAll().stream()
                //.map(user -> mapToUserResponse(user))
                .map(this::mapToUserResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserById(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));
        return mapToUserResponse(user);
    }

    @Override
    public UserResponse assigneRole(UUID userId, UUID roleId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));

        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Rol no encontrado"));

        if (userRoleRepository.existsByUserIdAndRoleId(userId, roleId))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El rol ya esta asignado al usuario");

        UserRoleId userRoleId = new UserRoleId(userId, roleId);

        UserRole userRole = UserRole.builder()
                .id(userRoleId)
                .user(user)
                .role(role)
                .build();

        userRoleRepository.save(userRole);

        return mapToUserResponse(user);
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


    /// kevin francisco quimuña pilataxi
    /// kfquimunap
    private String generarUsername(String fn, String mn, String ln) {
        String[] partes = ln.split(" ");
        String username = "";
        username = fn.charAt(0) + mn.charAt(0) + partes[0] + partes[1].charAt(0);

        if (userRepository.findByPartialUsername(username).size() > 0) {
            username += userRepository.findByPartialUsername(username).size() + 1;
        }
        return username.toLowerCase();
    }
}
