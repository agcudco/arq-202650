package ec.edu.espe.usuarios.services;

import ec.edu.espe.usuarios.dto.request.UserCreateRequest;
import ec.edu.espe.usuarios.dto.response.UserResponse;
import ec.edu.espe.usuarios.entity.User;

import java.util.List;
import java.util.UUID;

public interface UserService {
    UserResponse createUser(UserCreateRequest userRequest);

    List<UserResponse> getUsers();

    UserResponse getUserById(UUID id);

    UserResponse updateUser(UUID id, UserCreateRequest userRequest);

    void deleteUser(UUID id); // desactiva lógicamente

    UserResponse assignRole(UUID userId, UUID roleId);

    UserResponse removeRoleFromUser(UUID userId, UUID roleId);

     UserResponse getUserByDni(String dni);
}
