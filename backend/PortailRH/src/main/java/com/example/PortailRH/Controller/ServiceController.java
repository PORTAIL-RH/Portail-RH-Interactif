package com.example.PortailRH.Controller;

import com.example.PortailRH.Model.Service;
import com.example.PortailRH.Repository.ServiceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/services")
public class ServiceController {

    @Autowired
    private ServiceRepository serviceRepository;

    @GetMapping("/all")
    public List<Service> getAllServices() {
        return serviceRepository.findAll();
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