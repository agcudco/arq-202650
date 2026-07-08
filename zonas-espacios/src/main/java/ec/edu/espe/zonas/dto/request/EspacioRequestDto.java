package ec.edu.espe.zonas.dto.request;

import ec.edu.espe.zonas.entidades.EstadoEspacio;
import ec.edu.espe.zonas.entidades.TipoEspacio;
import jakarta.persistence.Enumerated;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class EspacioRequestDto {

    private String descripcion;

    @NotNull(message = "El tipo de espacio no puede ser nulo")
    private TipoEspacio tipo; // Enum, no lleva @NotBlank

    @NotNull(message = "El ID de la zona no puede ser nulo")
    private UUID idZona; // UUID, solo @NotNull
}
