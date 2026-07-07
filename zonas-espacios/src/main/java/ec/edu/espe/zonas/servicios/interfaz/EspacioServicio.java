package ec.edu.espe.zonas.servicios.interfaz;

import ec.edu.espe.zonas.dto.request.EspacioRequestDto;
import ec.edu.espe.zonas.dto.response.EspacioResponseDto;
import ec.edu.espe.zonas.dto.response.ZonaResponseDto;
import ec.edu.espe.zonas.entidades.EstadoEspacio;

import java.util.List;
import java.util.UUID;

public interface EspacioServicio {

    List<EspacioResponseDto> obtenerEspacios();

    EspacioResponseDto crearEspacio(EspacioRequestDto requestDto);

    EspacioResponseDto actualizarEspacio(EspacioRequestDto requestDto, UUID id);

    void eliminarEspacio(UUID id);

    EspacioResponseDto cambiarEstado(UUID id, EstadoEspacio estado);

    List<EspacioResponseDto> obtenerEspaciosPorEstado(String estado);

    List<EspacioResponseDto> obtenerEspaciosPorZonaEstado(UUID idZona, String estado);

    List<EspacioResponseDto> obtenerEspaciosPorZona(UUID idZona);
}
