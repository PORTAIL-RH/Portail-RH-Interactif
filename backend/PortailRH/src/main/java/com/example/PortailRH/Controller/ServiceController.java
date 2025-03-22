package com.example.PortailRH.Controller;

import com.example.PortailRH.Model.Service;
import com.example.PortailRH.Model.ServiceDTO;
import com.example.PortailRH.Repository.ServiceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/services")
public class ServiceController {

    @Autowired
    private ServiceRepository serviceRepository;

    @GetMapping("/all")
    public ResponseEntity<?> getAllServices() {
        try {
            List<Service> services = serviceRepository.findAll();
            List<ServiceDTO> serviceDTOs = services.stream()
                    .map(service -> new ServiceDTO(
                            service.getServiceId(),
                            service.getServiceName(),
                            service.getChefHierarchique() != null ? service.getChefHierarchique().getId() : null
                    ))
                    .collect(Collectors.toList());
            return ResponseEntity.ok(serviceDTOs);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Erreur lors de la récupération des services."));
        }
    }

    @PostMapping("/create")
    public Service createService(@RequestBody Service service) {
        return serviceRepository.save(service);
    }

    @GetMapping("/by-chef/{chefId}")
    public ResponseEntity<Service> getServiceByChefHierarchiqueId(@PathVariable String chefId) {
        Service service = serviceRepository.findByChefHierarchiqueId(chefId);
        if (service != null) {
            return ResponseEntity.ok(service);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}