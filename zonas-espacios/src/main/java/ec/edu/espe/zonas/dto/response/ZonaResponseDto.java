package ec.edu.espe.zonas.dto.response;

import ec.edu.espe.zonas.entidades.Espacio;
import ec.edu.espe.zonas.entidades.TipoZona;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ZonaResponseDto {

    private UUID id;
    private String nombre;
    private String codigo; //ZON-VIP-01, ZON-VIP-02, ZON-VIS-01 , ZON-REG-01
    private String descripcion;
    private int capacidad;
    private TipoZona tipo;
    private boolean activo;
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaActualizacion;
    private int espacios; //tarea -> calcular
}
