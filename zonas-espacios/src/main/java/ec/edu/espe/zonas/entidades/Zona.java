package ec.edu.espe.zonas.entidades;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "zonas")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
public class Zona {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String nombre;

    @Column(nullable = false, unique = true)
    private String codigo; //ZON-VIP-01, ZON-VIP-02, ZON-VIS-01 , ZON-REG-01

    @Column(nullable = true)
    private String descripcion;

    @Column(nullable = false)
    private int capacidad;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoZona tipo;

    @Column
    private boolean activo;

    @OneToMany(mappedBy = "zona",
            cascade = CascadeType.ALL,
            orphanRemoval = true)
    private List<Espacio> espacios;

    @Column
    private LocalDateTime fechaCreacion;

    @Column
    private LocalDateTime fechaActualizacion;
}
