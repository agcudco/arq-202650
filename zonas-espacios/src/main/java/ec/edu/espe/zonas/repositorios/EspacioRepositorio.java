package ec.edu.espe.zonas.repositorios;

import ec.edu.espe.zonas.entidades.Espacio;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface EspacioRepositorio extends JpaRepository<Espacio, UUID> {

    //List<Espacio> findByIdZona(UUID idZona);

   // List<Espacio> findByIdZonaAndEstado(UUID idZona, String estado);

    List<Espacio> findByEstado(String estado);

    //crear el metodo que permita buscar espacios por estado agrupados por zona
}
