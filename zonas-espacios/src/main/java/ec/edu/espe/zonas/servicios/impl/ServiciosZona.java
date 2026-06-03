package ec.edu.espe.zonas.servicios.impl;

import ec.edu.espe.zonas.dto.request.ZonaRequestDto;
import ec.edu.espe.zonas.dto.response.ZonaResponseDto;
import ec.edu.espe.zonas.entidades.Zona;
import ec.edu.espe.zonas.repositorios.ZonaRepositorio;
import ec.edu.espe.zonas.servicios.interfaz.ZonaServicio;
import ec.edu.espe.zonas.utils.MapperUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ServiciosZona implements ZonaServicio {

    private final MapperUtils mapper;
    private final ZonaRepositorio zonaRepositorio;

    @Override
    @Transactional(readOnly = true)
    public List<ZonaResponseDto> listarZonas() {
        return zonaRepositorio.findAll().stream().map(mapper::toZonaResponseDto).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ZonaResponseDto crearZona(ZonaRequestDto requestDto) {

        if (zonaRepositorio.existsByNombre(requestDto.getNombre()))
            throw new RuntimeException("Ya existe una zona con ese nombre" + requestDto.getNombre());

        Zona objZona = mapper.toZonaEntity(requestDto);
        objZona.setCodigo(generarNombreZona(requestDto.getNombre()));

        zonaRepositorio.save(objZona);
        return mapper.toZonaResponseDto(objZona);
    }


    @Override
    @Transactional
    public ZonaResponseDto actualizarZona(UUID idZona, ZonaRequestDto requestDto) {

        if (!zonaRepositorio.existsById(idZona))
            throw new RuntimeException("No existe una zona con id ingresado " + idZona);

        if (requestDto == null) return null;

        Zona objZona = mapper.toZonaEntity(requestDto);
        objZona.setId(idZona);

        return mapper.toZonaResponseDto(zonaRepositorio.save(objZona));
    }


    @Override
    public void eliminarZona(UUID id) {
        //tarea desactivar los hijos tbn
    }

    private String generarNombreZona(String zonaNombre) {
        return "Zona-" + UUID.randomUUID();
    }
}
