package ec.edu.espe.usuarios.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "role")
@Setter
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Data
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false, length = 25, unique = true)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Builder.Default
    private Boolean active = true;


    @OneToMany(mappedBy = "role", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @Builder.Default
    private Set<UserRole> userRoles = new HashSet<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
