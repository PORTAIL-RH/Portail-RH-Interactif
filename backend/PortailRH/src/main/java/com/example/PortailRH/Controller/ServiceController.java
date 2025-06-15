package com.example.PortailRH.Controller;

import com.example.PortailRH.Model.Personnel;
import com.example.PortailRH.Model.Service;
import com.example.PortailRH.Model.Validator;
import com.example.PortailRH.Repository.PersonnelRepository;
import com.example.PortailRH.Repository.ServiceRepository;
import com.example.PortailRH.Repository.ValidatorRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/services")
public class ServiceController {

    @Autowired
    private ServiceRepository serviceRepository;

    @Autowired
    private ValidatorRepository validatorRepository;

    @Autowired
    private PersonnelRepository personnelRepository;

    // Step 1: Create basic service with just a name
    @PostMapping("/create")
    public ResponseEntity<?> createBasicService(@RequestBody Map<String, String> request) {
        try {
            // Validate service name
            if (!request.containsKey("serviceName") || request.get("serviceName").trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Service name is required"));
            }

            // Check if service already exists
            Optional<Service> existingService = serviceRepository.findByServiceName(request.get("serviceName"));
            if (existingService.isPresent()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Service with this name already exists"));
            }

            // Create and save new service
            Service service = new Service();
            service.setServiceName(request.get("serviceName"));
            Service savedService = serviceRepository.save(service);

            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "id", savedService.getId(),
                    "serviceName", savedService.getServiceName()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error creating service: " + e.getMessage()));
        }
    }
    @GetMapping("/basic")
    public ResponseEntity<?> getBasicServices() {
        try {
            // Get all services
            List<Service> allServices = serviceRepository.findAll();

            // Filter services that don't have any chiefs assigned
            List<Map<String, Object>> basicServices = allServices.stream()
                    .filter(service -> service.getChef1() == null &&
                            service.getChef2() == null &&
                            service.getChef3() == null)
                    .map(service -> {
                        Map<String, Object> serviceMap = new HashMap<>();
                        serviceMap.put("id", service.getId());
                        serviceMap.put("serviceName", service.getServiceName());
                        return serviceMap;
                    })
                    .collect(Collectors.toList());

            return ResponseEntity.ok(basicServices);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error retrieving basic services: " + e.getMessage()));
        }
    }
    // Step 2: Assign chefs to an existing service
    @PutMapping("/{serviceId}/assign-chefs")
    public ResponseEntity<?> assignChefsToService(
            @PathVariable String serviceId,
            @RequestBody Map<String, Object> request) {
        try {
            // Find the service
            Optional<Service> serviceOptional = serviceRepository.findById(serviceId);
            if (serviceOptional.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            Service service = serviceOptional.get();
            List<Validator> createdValidators = new ArrayList<>();

            // Process each chef
            for (int i = 1; i <= 3; i++) {
                String chefKey = "chef" + i;
                if (request.containsKey(chefKey)) {
                    Map<String, Object> chefMap = (Map<String, Object>) request.get(chefKey);

                    // Validate chef data
                    if (!chefMap.containsKey("personnelId") || chefMap.get("personnelId").toString().isEmpty()) {
                        return ResponseEntity.badRequest()
                                .body(Map.of("message", "personnelId is required for chef" + i));
                    }

                    String personnelId = chefMap.get("personnelId").toString();
                    Optional<Personnel> chefOptional = personnelRepository.findById(personnelId);
                    if (chefOptional.isEmpty()) {
                        return ResponseEntity.badRequest()
                                .body(Map.of("message", "Personnel not found with id: " + personnelId + " for chef" + i));
                    }

                    // Get poid (default to 0 if not specified)
                    int poid = chefMap.containsKey("poid") ?
                            Integer.parseInt(chefMap.get("poid").toString()) : 0;

                    // Assign chef and poid to service
                    Personnel chef = chefOptional.get();
                    switch (i) {
                        case 1:
                            service.setChef1(chef);
                            service.setPoid1(poid);
                            break;
                        case 2:
                            service.setChef2(chef);
                            service.setPoid2(poid);
                            break;
                        case 3:
                            service.setChef3(chef);
                            service.setPoid3(poid);
                            break;
                    }

                    // Create Validator entry
                    Validator validator = new Validator(service, chef, poid);
                    validatorRepository.save(validator);
                    createdValidators.add(validator);
                }
            }

            // Update service with chef assignments
            Service updatedService = serviceRepository.save(service);

            // Build response
            Map<String, Object> response = new HashMap<>();
            response.put("service", buildServiceResponse(updatedService));
            response.put("validators", createdValidators.stream()
                    .map(this::buildValidatorResponse)
                    .collect(Collectors.toList()));

            return ResponseEntity.ok(response);
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Invalid poid value (must be a number)"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error assigning chefs: " + e.getMessage()));
        }
    }

    @GetMapping("/all")
    public ResponseEntity<?> getAllServices() {
        try {
            List<Service> services = serviceRepository.findAll();

            List<Map<String, Object>> serviceDTOs = services.stream()
                    .map(service -> {
                        Map<String, Object> serviceMap = new HashMap<>();
                        serviceMap.put("id", service.getId());
                        serviceMap.put("serviceName", service.getServiceName());

                        // Handle chef1
                        if (service.getChef1() != null) {
                            Map<String, Object> chef1Map = new HashMap<>();
                            chef1Map.put("id", service.getChef1().getId());
                            chef1Map.put("poid", service.getPoid1());
                            serviceMap.put("chef1", chef1Map);
                        }

                        // Handle chef2
                        if (service.getChef2() != null) {
                            Map<String, Object> chef2Map = new HashMap<>();
                            chef2Map.put("id", service.getChef2().getId());
                            chef2Map.put("poid", service.getPoid2());
                            serviceMap.put("chef2", chef2Map);
                        }

                        // Handle chef3
                        if (service.getChef3() != null) {
                            Map<String, Object> chef3Map = new HashMap<>();
                            chef3Map.put("id", service.getChef3().getId());
                            chef3Map.put("poid", service.getPoid3());
                            serviceMap.put("chef3", chef3Map);
                        }

                        return serviceMap;
                    })
                    .collect(Collectors.toList());

            return ResponseEntity.ok(serviceDTOs);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error retrieving services: " + e.getMessage()));
        }
    }

    @GetMapping("/by-chef/{matricule}")
    public ResponseEntity<?> getServiceByChefMatricule(@PathVariable String matricule) {
        try {
            Optional<Personnel> chefOptional = personnelRepository.findByMatricule(matricule);
            if (chefOptional.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            String chefId = chefOptional.get().getId();
            List<Service> services = serviceRepository.findByChef1IdOrChef2IdOrChef3Id(chefId, chefId, chefId);

            if (!services.isEmpty()) {
                List<Map<String, Object>> response = services.stream()
                        .map(service -> {
                            Map<String, Object> serviceMap = new HashMap<>();
                            serviceMap.put("id", service.getId());
                            serviceMap.put("serviceName", service.getServiceName());

                            // Add chef information
                            if (service.getChef1() != null && service.getChef1().getId().equals(chefId)) {
                                serviceMap.put("chefRole", "chef1");
                                serviceMap.put("poid", service.getPoid1());
                            } else if (service.getChef2() != null && service.getChef2().getId().equals(chefId)) {
                                serviceMap.put("chefRole", "chef2");
                                serviceMap.put("poid", service.getPoid2());
                            } else if (service.getChef3() != null && service.getChef3().getId().equals(chefId)) {
                                serviceMap.put("chefRole", "chef3");
                                serviceMap.put("poid", service.getPoid3());
                            }

                            return serviceMap;
                        })
                        .collect(Collectors.toList());

                return ResponseEntity.ok(response);
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error finding service: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getServiceById(@PathVariable String id) {
        try {
            Optional<Service> service = serviceRepository.findById(id);
            if (service.isPresent()) {
                Service s = service.get();
                Map<String, Object> response = new HashMap<>();
                response.put("id", s.getId());
                response.put("serviceName", s.getServiceName());

                // Add all chefs with their poids
                if (s.getChef1() != null) {
                    Map<String, Object> chef1 = new HashMap<>();
                    chef1.put("matricule", s.getChef1().getMatricule());
                    chef1.put("poid", s.getPoid1());
                    response.put("chef1", chef1);
                }
                if (s.getChef2() != null) {
                    Map<String, Object> chef2 = new HashMap<>();
                    chef2.put("matricule", s.getChef2().getMatricule());
                    chef2.put("poid", s.getPoid2());
                    response.put("chef2", chef2);
                }
                if (s.getChef3() != null) {
                    Map<String, Object> chef3 = new HashMap<>();
                    chef3.put("matricule", s.getChef3().getMatricule());
                    chef3.put("poid", s.getPoid3());
                    response.put("chef3", chef3);
                }

                return ResponseEntity.ok(response);
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error retrieving service: " + e.getMessage()));
        }
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<?> updateService(
            @PathVariable String id,
            @RequestBody Map<String, Object> request) {
        try {
            Optional<Service> serviceOptional = serviceRepository.findById(id);
            if (serviceOptional.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            if (!request.containsKey("serviceName") || request.get("serviceName").toString().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Service name is required"));
            }

            Service service = serviceOptional.get();
            service.setServiceName(request.get("serviceName").toString());

            // Supprimer les anciens validators liés à ce service
            validatorRepository.deleteByServiceId(service.getId());

            for (int i = 1; i <= 3; i++) {
                String chefKey = "chef" + i + "Matricule";
                String poidKey = "poid" + i;

                if (request.containsKey(chefKey)) {
                    String matricule = request.get(chefKey).toString();

                    if (matricule.isEmpty()) {
                        switch (i) {
                            case 1 -> { service.setChef1(null); service.setPoid1(0); }
                            case 2 -> { service.setChef2(null); service.setPoid2(0); }
                            case 3 -> { service.setChef3(null); service.setPoid3(0); }
                        }
                    } else {
                        Optional<Personnel> chefOptional = personnelRepository.findByMatricule(matricule);
                        if (chefOptional.isEmpty()) {
                            return ResponseEntity.badRequest()
                                    .body(Map.of("message", "Personnel with matricule " + matricule + " not found"));
                        }

                        Personnel chef = chefOptional.get();
                        String chefId = chef.getId();

                        List<Service> existingServices = serviceRepository.findByChef1IdOrChef2IdOrChef3Id(chefId, chefId, chefId);
                        if (!existingServices.isEmpty() &&
                                (existingServices.size() > 1 || !existingServices.get(0).getId().equals(id))) {
                            return ResponseEntity.badRequest()
                                    .body(Map.of("message", "This personnel is already chef in another service"));
                        }

                        int poid = request.containsKey(poidKey) ? Integer.parseInt(request.get(poidKey).toString()) : 0;
                        switch (i) {
                            case 1 -> { service.setChef1(chef); service.setPoid1(poid); }
                            case 2 -> { service.setChef2(chef); service.setPoid2(poid); }
                            case 3 -> { service.setChef3(chef); service.setPoid3(poid); }
                        }

                        // Ajouter le validator correspondant
                        Validator validator = new Validator(service, chef, poid);
                        validatorRepository.save(validator);
                    }
                }
            }

            Service updatedService = serviceRepository.save(service);
            return ResponseEntity.ok(updatedService);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error updating service: " + e.getMessage()));
        }
    }


    private static final Logger log = LoggerFactory.getLogger(ServiceController.class);

    @DeleteMapping("/delete/{id}")
    @Transactional // Ensures the operations are treated as a single unit (requires a replica set for MongoDB)
    public ResponseEntity<?> deleteService(@PathVariable String id) {
        try {
            // Step 1: Check business rule: Cannot delete a service if personnel are assigned to it.
            // This uses the CORRECTED method name to query the nested document's ID.
            if (personnelRepository.existsByService_Id(id)) {
                log.warn("Attempt to delete service ID {} which is still assigned to personnel.", id);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Cannot delete service. It is still assigned to active personnel."));
            }

            // Step 2: Verify the service exists before attempting to delete it.
            // Using orElseThrow for a cleaner "not found" check.
            Service service = serviceRepository.findById(id)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Service with ID " + id + " not found."));

            // Step 3: Delete all dependent 'Validator' records. This is critical for data integrity.
            log.info("Deleting all validators associated with service ID: {}", id);
            validatorRepository.deleteAllByService_Id(id);

            // Step 4: Delete the service itself, now that its dependencies are removed.
            log.info("Deleting service: {} with ID: {}", service.getServiceName(), id);
            serviceRepository.delete(service);

            // Step 5: Return a success response.
            return ResponseEntity.ok(Map.of("message", "Service '" + service.getServiceName() + "' and its validators were deleted successfully."));

        } catch (ResponseStatusException e) {
            // Catches the "Service not found" exception from the findById().orElseThrow() call.
            log.error("Failed to delete service: {}", e.getReason());
            return ResponseEntity.status(e.getStatusCode()).body(Map.of("message", e.getReason()));
        } catch (Exception e) {
            // Catches any other unexpected errors (e.g., database connection issues).
            // This was the block being hit before the fix.
            log.error("An unexpected error occurred while deleting service with ID {}:", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "An internal error occurred during service deletion. See logs for details."));
        }
    }

    // Helper methods
    private Map<String, Object> buildServiceResponse(Service service) {
        Map<String, Object> serviceMap = new HashMap<>();
        serviceMap.put("id", service.getId());
        serviceMap.put("serviceName", service.getServiceName());

        if (service.getChef1() != null) {
            serviceMap.put("chef1", buildChefResponse(service.getChef1(), service.getPoid1()));
        }
        if (service.getChef2() != null) {
            serviceMap.put("chef2", buildChefResponse(service.getChef2(), service.getPoid2()));
        }
        if (service.getChef3() != null) {
            serviceMap.put("chef3", buildChefResponse(service.getChef3(), service.getPoid3()));
        }

        return serviceMap;
    }

    private Map<String, Object> buildChefResponse(Personnel chef, int poid) {
        Map<String, Object> chefMap = new HashMap<>();
        chefMap.put("personnelId", chef.getId());
        chefMap.put("matricule", chef.getMatricule());
        chefMap.put("fullName", chef.getNom());
        chefMap.put("poid", poid);
        return chefMap;
    }

    private Map<String, Object> buildValidatorResponse(Validator validator) {
        Map<String, Object> validatorMap = new HashMap<>();
        validatorMap.put("id", validator.getId());
        validatorMap.put("serviceId", validator.getService().getId());
        validatorMap.put("serviceName", validator.getService().getServiceName());
        validatorMap.put("chefId", validator.getChef().getId());
        validatorMap.put("chefMatricule", validator.getChef().getMatricule());
        validatorMap.put("poid", validator.getPoid());
        return validatorMap;
    }
}