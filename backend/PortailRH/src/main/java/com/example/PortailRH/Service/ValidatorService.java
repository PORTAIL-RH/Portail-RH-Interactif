package com.example.PortailRH.Service;

import com.example.PortailRH.Model.Validator;
import com.example.PortailRH.Repository.ValidatorRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ValidatorService {

    private final ValidatorRepository validatorRepository;

    public ValidatorService(ValidatorRepository validatorRepository) {
        this.validatorRepository = validatorRepository;
    }

    public List<Validator> getAllValidators() {
        return validatorRepository.findAllWithDetails();
    }

    public Validator getValidatorById(String id) {
        return validatorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Validator not found with id: " + id));
    }

    public List<Validator> getValidatorsByChef(String chefId) {
        // Try different query methods until we get results
        List<Validator> validators = validatorRepository.findByChefId(chefId);

        if (validators.isEmpty()) {
            validators = validatorRepository.findByChefIdAsObjectId(chefId);
        }

        if (validators.isEmpty()) {
            validators = validatorRepository.findByChefIdWithDBRef(chefId);
        }

        return validators;
    }

    public List<Validator> getValidatorsByService(String serviceId) {
        return validatorRepository.findByServiceId(serviceId);
    }

    public Validator getValidatorByChefAndService(String chefId, String serviceId) {
        return validatorRepository.findByChefIdAndServiceId(chefId, serviceId)
                .orElseThrow(() -> new RuntimeException(
                        "Validator not found for chefId: " + chefId + " and serviceId: " + serviceId));
    }
}