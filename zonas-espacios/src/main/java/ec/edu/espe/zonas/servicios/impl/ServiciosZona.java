package ec.edu.espe.zonas.servicios.impl;

import ec.edu.espe.zonas.dto.request.ZonaRequestDto;
import ec.edu.espe.zonas.dto.response.ZonaResponseDto;
import ec.edu.espe.zonas.entidades.TipoZona;
import ec.edu.espe.zonas.entidades.Zona;
import ec.edu.espe.zonas.repositorios.ZonaRepositorio;
import ec.edu.espe.zonas.servicios.interfaz.ZonaServicio;
import ec.edu.espe.zonas.utils.MapperUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
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
        return zonaRepositorio.findAll().stream()
                .map(mapper::toZonaResponseDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ZonaResponseDto crearZona(ZonaRequestDto requestDto) {
        if (zonaRepositorio.existsByNombre(requestDto.getNombre()))
            throw new RuntimeException("Ya existe una zona con ese nombre: " + requestDto.getNombre());

        Zona objZona = mapper.toZonaEntity(requestDto);

        // Generar código corto: abreviatura del tipo + número secuencial (2 dígitos)
        String abreviatura = obtenerAbreviaturaTipo(requestDto.getTipo());
        long count = zonaRepositorio.countByTipo(requestDto.getTipo());
        String codigo = abreviatura + "-" + String.format("%02d", count + 1);
        objZona.setCodigo(codigo);
        objZona.setActivo(true);
        objZona.setFechaCreacion(LocalDateTime.now());
        objZona.setFechaActualizacion(LocalDateTime.now());

        zonaRepositorio.save(objZona);
        return mapper.toZonaResponseDto(objZona);
    }

    @Override
    @Transactional
    public ZonaResponseDto actualizarZona(UUID idZona, ZonaRequestDto requestDto) {
        if (!zonaRepositorio.existsById(idZona))
            throw new RuntimeException("No existe una zona con id ingresado: " + idZona);

        Zona objZona = mapper.toZonaEntity(requestDto);
        objZona.setId(idZona);
        objZona.setFechaActualizacion(LocalDateTime.now());
        // Mantener el código existente (no se actualiza)
        Zona existente = zonaRepositorio.findById(idZona).orElseThrow();
        objZona.setCodigo(existente.getCodigo());

        return mapper.toZonaResponseDto(zonaRepositorio.save(objZona));
    }

    @Override
    @Transactional
    public void eliminarZona(UUID id) {
        // Desactivar hijos (espacios) o eliminar en cascada (ya configurado)
        if (!zonaRepositorio.existsById(id))
            throw new RuntimeException("Zona no encontrada");
        zonaRepositorio.deleteById(id);
    }

    private String obtenerAbreviaturaTipo(TipoZona tipo) {
        return switch (tipo) {
            case VIP -> "VIP";
            case VISITANTES -> "VIS";
            case GENERAL -> "GEN";
            case PREFERENCIAL -> "PRE";
        };
    }
}