package com.example.PortailRH.Controller;

import com.example.PortailRH.Model.*;
import com.example.PortailRH.Repository.*;
import com.example.PortailRH.Service.ServiceCreationRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/services")
public class ServiceController {

    @Autowired
    private ServiceRepository serviceRepository;

    @Autowired
    private PersonnelRepository personnelRepository;

    @GetMapping("/all")
    public ResponseEntity<?> getAllServices() {
        try {
            List<Service> services = serviceRepository.findAll();
            List<ServiceDTO> serviceDTOs = services.stream()
                    .map(service -> new ServiceDTO(
                            service.getId(),
                            service.getServiceName(),
                            service.getChefHierarchique() != null ?
                                    service.getChefHierarchique().getMatricule() : null
                    ))
                    .collect(Collectors.toList());
            return ResponseEntity.ok(serviceDTOs);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error retrieving services: " + e.getMessage()));
        }
    }

    @PostMapping("/create")
    public ResponseEntity<?> createService(@RequestBody ServiceCreationRequest request) {
        try {
            // Validate input
            if (request.getServiceName() == null || request.getServiceName().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Service name is required"));
            }

            Service service = new Service();
            service.setServiceName(request.getServiceName());

            // Set chef if provided
            if (request.getChefMatricule() != null && !request.getChefMatricule().isEmpty()) {
                Optional<Personnel> chefOptional = personnelRepository.findByMatricule(request.getChefMatricule());
                if (chefOptional.isEmpty()) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("message", "Personnel with matricule " +
                                    request.getChefMatricule() + " not found"));
                }

                Personnel chef = chefOptional.get();

                // Check if this personnel is already a chef of another service
                Service existingService = serviceRepository.findByChefHierarchiqueId(chef.getId());
                if (existingService != null) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("message", "This personnel is already chef of service: " +
                                    existingService.getServiceName()));
                }

                service.setChefHierarchique(chef);
            }

            Service savedService = serviceRepository.save(service);
            return ResponseEntity.ok(new ServiceDTO(
                    savedService.getId(),
                    savedService.getServiceName(),
                    savedService.getChefHierarchique() != null ?
                            savedService.getChefHierarchique().getMatricule() : null
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error creating service: " + e.getMessage()));
        }
    }

    @GetMapping("/by-chef/{matricule}")
    public ResponseEntity<?> getServiceByChefMatricule(@PathVariable String matricule) {
        try {
            Optional<Personnel> chefOptional = personnelRepository.findByMatricule(matricule);
            if (chefOptional.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            Service service = serviceRepository.findByChefHierarchiqueId(chefOptional.get().getId());
            if (service != null) {
                return ResponseEntity.ok(new ServiceDTO(
                        service.getId(),
                        service.getServiceName(),
                        service.getChefHierarchique().getMatricule()
                ));
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error finding service"));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getServiceById(@PathVariable String id) {
        try {
            Optional<Service> service = serviceRepository.findById(id);
            if (service.isPresent()) {
                return ResponseEntity.ok(new ServiceDTO(
                        service.get().getId(),
                        service.get().getServiceName(),
                        service.get().getChefHierarchique() != null ?
                                service.get().getChefHierarchique().getMatricule() : null
                ));
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error retrieving service"));
        }
    }
    @PutMapping("/update/{id}")
    public ResponseEntity<?> updateService(
            @PathVariable String id,
            @RequestBody ServiceCreationRequest request) {
        try {
            // Vérifier l'existence du service
            Optional<Service> serviceOptional = serviceRepository.findById(id);
            if (serviceOptional.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            // Validation des données
            if (request.getServiceName() == null || request.getServiceName().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Service name is required"));
            }

            Service service = serviceOptional.get();
            service.setServiceName(request.getServiceName());

            // Gestion du chef hiérarchique
            if (request.getChefMatricule() != null && !request.getChefMatricule().isEmpty()) {
                Optional<Personnel> chefOptional = personnelRepository.findByMatricule(request.getChefMatricule());
                if (chefOptional.isEmpty()) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("message", "Personnel with matricule " +
                                    request.getChefMatricule() + " not found"));
                }

                Personnel chef = chefOptional.get();

                // Vérifier si ce personnel est déjà chef d'un autre service
                Service existingService = serviceRepository.findByChefHierarchiqueId(chef.getId());
                if (existingService != null && !existingService.getId().equals(id)) {
                    return ResponseEntity.badRequest()
                            .body(Map.of("message", "This personnel is already chef of service: " +
                                    existingService.getServiceName()));
                }

                service.setChefHierarchique(chef);
            } else {
                service.setChefHierarchique(null); // Retirer le chef si aucun matricule fourni
            }

            Service updatedService = serviceRepository.save(service);
            return ResponseEntity.ok(new ServiceDTO(
                    updatedService.getId(),
                    updatedService.getServiceName(),
                    updatedService.getChefHierarchique() != null ?
                            updatedService.getChefHierarchique().getMatricule() : null
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error updating service: " + e.getMessage()));
        }
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<?> deleteService(@PathVariable String id) {
        try {
            // Vérifier l'existence du service
            Optional<Service> serviceOptional = serviceRepository.findById(id);
            if (serviceOptional.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            // Vérifier si le service a des employés associés
            List<Personnel> personnelList = personnelRepository.findByServiceId(id);
            if (!personnelList.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Cannot delete service with associated personnel"));
            }

            serviceRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "Service deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error deleting service: " + e.getMessage()));
        }
    }

}