package ec.edu.espe.zonas.servicios.impl;

import ec.edu.espe.zonas.dto.request.EspacioRequestDto;
import ec.edu.espe.zonas.dto.response.EspacioResponseDto;
import ec.edu.espe.zonas.entidades.Espacio;
import ec.edu.espe.zonas.entidades.EstadoEspacio;
import ec.edu.espe.zonas.entidades.Zona;
import ec.edu.espe.zonas.repositorios.EspacioRepositorio;
import ec.edu.espe.zonas.repositorios.ZonaRepositorio;
import ec.edu.espe.zonas.servicios.interfaz.EspacioServicio;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class ServiciosEspacio implements EspacioServicio {

    private final EspacioRepositorio espacioRepositorio;
    private final ZonaRepositorio zonaRepositorio;

    @Override
    @Transactional(readOnly = true)
    public List<EspacioResponseDto> obtenerEspacios() {
        log.info("Obteniendo todos los espacios");
        return espacioRepositorio.findAll()
                .stream()
                .map(this::convertirAResponseDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public EspacioResponseDto crearEspacio(EspacioRequestDto requestDto) {
        log.info("Creando espacio para zona ID: {}", requestDto.getIdZona());

        Zona zona = zonaRepositorio.findById(requestDto.getIdZona())
                .orElseThrow(() -> {
                    log.error("Zona no encontrada con ID: {}", requestDto.getIdZona());
                    return new RuntimeException("Zona no encontrada");
                });

        // Generar nombre secuencial: códigoZona + "-" + número de espacios + 1
        long cantidadEspacios = espacioRepositorio.findByZonaId(zona.getId()).size();
        String numeroFormateado = String.format("%03d", cantidadEspacios + 1);
        String nombreGenerado = zona.getCodigo() + "-" + numeroFormateado;

        Espacio espacio = Espacio.builder()
                .nombre(nombreGenerado)
                .descripcion(requestDto.getDescripcion())
                .tipo(requestDto.getTipo())
                .activo(true)
                .zona(zona)
                .estado(EstadoEspacio.DISPONIBLE) // Por defecto disponible al crear
                .fechaCreacion(LocalDateTime.now())
                .fechaActualizacion(LocalDateTime.now())
                .build();

        Espacio espacioGuardado = espacioRepositorio.save(espacio);
        log.info("Espacio creado con ID: {}, nombre: {}", espacioGuardado.getId(), espacioGuardado.getNombre());
        return convertirAResponseDto(espacioGuardado);
    }

    @Override
    @Transactional
    public EspacioResponseDto actualizarEspacio(EspacioRequestDto requestDto, UUID id) {
        log.info("Actualizando espacio con ID: {}", id);

        Espacio espacioExistente = espacioRepositorio.findById(id)
                .orElseThrow(() -> {
                    log.error("Espacio no encontrado con ID: {}", id);
                    return new RuntimeException("Espacio no encontrado");
                });

        // Solo actualizamos descripción, tipo y posiblemente zona (si se envía idZona)
        if (requestDto.getDescripcion() != null) {
            espacioExistente.setDescripcion(requestDto.getDescripcion());
        }
        if (requestDto.getTipo() != null) {
            espacioExistente.setTipo(requestDto.getTipo());
        }
        if (requestDto.getIdZona() != null) {
            Zona nuevaZona = zonaRepositorio.findById(requestDto.getIdZona())
                    .orElseThrow(() -> {
                        log.error("Zona no encontrada con ID: {}", requestDto.getIdZona());
                        return new RuntimeException("Zona no encontrada");
                    });
            espacioExistente.setZona(nuevaZona);
            // Recalcular nombre? Podría cambiarse, pero en este ejemplo no lo hacemos
        }

        espacioExistente.setFechaActualizacion(LocalDateTime.now());
        Espacio espacioActualizado = espacioRepositorio.save(espacioExistente);
        log.info("Espacio actualizado con ID: {}", espacioActualizado.getId());
        return convertirAResponseDto(espacioActualizado);
    }

    @Override
    @Transactional
    public void eliminarEspacio(UUID id) {
        log.info("Eliminando espacio con ID: {}", id);
        if (!espacioRepositorio.existsById(id)) {
            log.error("Intento de eliminar espacio inexistente con ID: {}", id);
            throw new RuntimeException("Espacio no encontrado");
        }
        espacioRepositorio.deleteById(id);
        log.info("Espacio eliminado con ID: {}", id);
    }

    @Override
    @Transactional
    public EspacioResponseDto cambiarEstado(UUID id, EstadoEspacio estado) {
        log.info("Cambiando estado del espacio ID: {} a {}", id, estado);
        Espacio espacio = espacioRepositorio.findById(id)
                .orElseThrow(() -> {
                    log.error("Espacio no encontrado con ID: {}", id);
                    return new RuntimeException("Espacio no encontrado");
                });
        espacio.setEstado(estado);
        espacio.setFechaActualizacion(LocalDateTime.now());
        Espacio actualizado = espacioRepositorio.save(espacio);
        log.info("Estado actualizado para espacio ID: {}", id);
        return convertirAResponseDto(actualizado);
    }

    @Override
    @Transactional(readOnly = true)
    public List<EspacioResponseDto> obtenerEspaciosPorEstado(String estado) {
        log.info("Obteniendo espacios por estado: {}", estado);
        EstadoEspacio estadoEnum;
        try {
            estadoEnum = EstadoEspacio.valueOf(estado.toUpperCase());
        } catch (IllegalArgumentException e) {
            log.error("Estado inválido: {}", estado);
            throw new RuntimeException("Estado inválido");
        }
        return espacioRepositorio.findByEstado(estadoEnum)
                .stream()
                .map(this::convertirAResponseDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<EspacioResponseDto> obtenerEspaciosPorZonaEstado(UUID idZona, String estado) {
        log.info("Obteniendo espacios para zona ID: {} y estado: {}", idZona, estado);
        EstadoEspacio estadoEnum;
        try {
            estadoEnum = EstadoEspacio.valueOf(estado.toUpperCase());
        } catch (IllegalArgumentException e) {
            log.error("Estado inválido: {}", estado);
            throw new RuntimeException("Estado inválido");
        }
        return espacioRepositorio.findByZonaIdAndEstado(idZona, estadoEnum)
                .stream()
                .map(this::convertirAResponseDto)
                .collect(Collectors.toList());
    }

    // Método privado para convertir entidad a DTO de respuesta
    private EspacioResponseDto convertirAResponseDto(Espacio espacio) {
        return EspacioResponseDto.builder()
                .id(espacio.getId())
                .nombre(espacio.getNombre())
                .descripcion(espacio.getDescripcion())
                .tipo(espacio.getTipo())
                .activo(espacio.isActivo())
                .nombreZona(espacio.getZona() != null ? espacio.getZona().getNombre() : null)
                .idZona(espacio.getZona() != null ? espacio.getZona().getId() : null)
                .estado(espacio.getEstado())
                .fechaCreacion(espacio.getFechaCreacion())
                .fechaActualizacion(espacio.getFechaActualizacion())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<EspacioResponseDto> obtenerEspaciosPorZona(UUID idZona) {
        log.info("Obteniendo espacios para zona ID: {}", idZona);
        // Opcional: verificar que la zona exista, pero el repositorio devolverá lista
        // vacía si no hay espacios
        return espacioRepositorio.findByZonaId(idZona)
                .stream()
                .map(this::convertirAResponseDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public EspacioResponseDto obtenerEspacioPorId(UUID id) {
        log.info("Buscando espacio con ID: {}", id);
        Espacio espacio = espacioRepositorio.findById(id)
                .orElseThrow(() -> {
                    log.error("Espacio no encontrado con ID: {}", id);
                    return new RuntimeException("Espacio no encontrado con ID: " + id);
                });
        return convertirAResponseDto(espacio);
    }
}