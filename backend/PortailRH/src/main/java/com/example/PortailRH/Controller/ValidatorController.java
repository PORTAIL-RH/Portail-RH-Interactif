package com.example.PortailRH.Controller;

import com.example.PortailRH.Model.Validator;
import com.example.PortailRH.Repository.ServiceRepository;
import com.example.PortailRH.Service.ValidatorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/validators")
public class ValidatorController {

    @Autowired
    private ValidatorService validatorService;

    private final ServiceRepository serviceRepository;

    public ValidatorController(ServiceRepository serviceRepository) {
        this.serviceRepository = serviceRepository;
    }

    @GetMapping("/by-chef/{chefId}")
    public ResponseEntity<?> getValidatorsByChef(@PathVariable String chefId) {
        try {
            List<Validator> validators = validatorService.getValidatorsByChef(chefId);

            if (validators.isEmpty()) {
                return ResponseEntity.ok(Collections.emptyList());
            }

            // Transform to simple response format
            List<Map<String, Object>> response = validators.stream()
                    .map(validator -> {
                        Map<String, Object> result = new HashMap<>();
                        result.put("serviceId", validator.getService().getId());
                        result.put("serviceName", validator.getService().getServiceName());
                        result.put("poid", validator.getPoid());
                        return result;
                    })
                    .collect(Collectors.toList());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Error retrieving validators: " + e.getMessage()));
        }
    }

    @GetMapping("/chef-services/{chefId}")
    public ResponseEntity<List<Validator>> getChefServicesWithPoid(@PathVariable String chefId) {
        List<Validator> validators = validatorService.getValidatorsByChef(chefId);
        return ResponseEntity.ok(validators);
    }

    @GetMapping("/by-service/{serviceId}")
    public ResponseEntity<List<Validator>> getValidatorsByService(@PathVariable String serviceId) {
        List<Validator> validators = validatorService.getValidatorsByService(serviceId);
        return ResponseEntity.ok(validators);
    }

    @GetMapping("/by-chef-and-service/{chefId}/{serviceId}")
    public ResponseEntity<Validator> getValidatorByChefAndService(
            @PathVariable String chefId,
            @PathVariable String serviceId) {
        Validator validator = validatorService.getValidatorByChefAndService(chefId, serviceId);
        return ResponseEntity.ok(validator);
    }

    @GetMapping
    public ResponseEntity<List<Validator>> getAllValidators() {
        List<Validator> validators = validatorService.getAllValidators();
        return ResponseEntity.ok(validators);
    }
}