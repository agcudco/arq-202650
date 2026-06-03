package ec.edu.espe.zonas.servicios.impl;

import ec.edu.espe.zonas.dto.request.EspacioRequestDto;
import ec.edu.espe.zonas.dto.response.EspacioResponseDto;
import ec.edu.espe.zonas.entidades.EstadoEspacio;
import ec.edu.espe.zonas.servicios.interfaz.EspacioServicio;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class ServiciosEspacio implements EspacioServicio {
    @Override
    public List<EspacioResponseDto> obtenerEspacios() {
        return List.of();
    }

    @Override
    public EspacioResponseDto crearEspacio(EspacioRequestDto requestDto) {
        return null;
    }

    @Override
    public EspacioResponseDto actualizarEspacio(EspacioRequestDto requestDto) {
        return null;
    }

    @Override
    public void eliminarEspacio(String id) {

    }

    @Override
    public EspacioResponseDto cambiarEstado(UUID id, EstadoEspacio estado) {
        return null;
    }

    @Override
    public List<EspacioResponseDto> obtenerEspaciosPorEstado(String estado) {
        return List.of();
    }

    @Override
    public List<EspacioResponseDto> obtenerEspaciosPorZonaEstado(UUID idZona, String estado) {
        return List.of();
    }
}
