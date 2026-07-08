package ec.edu.espe.usuarios.controller;

import ec.edu.espe.usuarios.dto.request.UserCreateRequest;
import ec.edu.espe.usuarios.dto.response.UserResponse;
import ec.edu.espe.usuarios.services.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(userService.getUsers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable UUID id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @PostMapping
    public ResponseEntity<UserResponse> createUser(@Valid @RequestBody UserCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.createUser(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserResponse> updateUser(@PathVariable UUID id,
            @Valid @RequestBody UserCreateRequest request) {
        return ResponseEntity.ok(userService.updateUser(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable UUID id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    // Asignar rol
    @PostMapping("/{userId}/roles/{roleId}")
    public ResponseEntity<UserResponse> assignRole(@PathVariable UUID userId, @PathVariable UUID roleId) {
        return ResponseEntity.ok(userService.assignRole(userId, roleId));
    }

    // Desasignar rol
    @DeleteMapping("/{userId}/roles/{roleId}")
    public ResponseEntity<UserResponse> removeRole(@PathVariable UUID userId, @PathVariable UUID roleId) {
        return ResponseEntity.ok(userService.removeRoleFromUser(userId, roleId));
    }

    // NUEVO ENDPOINT: Buscar por DNI
    @GetMapping("/dni/{dni}")
    public ResponseEntity<UserResponse> getUserByDni(@PathVariable String dni) {
        return ResponseEntity.ok(userService.getUserByDni(dni));
    }
}