package ec.edu.espe.zonas.dto.request;

import ec.edu.espe.zonas.entidades.TipoZona;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ZonaRequestDto {

    @NotNull(message = "El nombre de la zona no puede ser nulo")
    @NotBlank(message = "El nombre de la zona no puede estar vacío")
    @Size(max = 50, message = "El nombre de la zona no puede tener más de 10 caracteres")
    private String nombre;

    private String descripcion;

    @Min(value = 1, message = "La capacidad debe ser un número positivo")
    @Max(value = 200, message = "La capacidad no puede ser mayor a 200")
    private int capacidad;

    @NotNull(message = "El tipo de zona no puede ser nulo")
    private TipoZona tipo;
}
