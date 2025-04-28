package com.example.PortailRH.Repository;

import com.example.PortailRH.Model.Personnel;
import com.example.PortailRH.Model.Service;
import org.bson.types.ObjectId;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
@Repository
public interface PersonnelRepository extends MongoRepository<Personnel, String> {
    Optional<Personnel> findByMatricule(String matricule);
    Optional<Personnel> findByEmail(String email);
    Optional<Personnel> findById(String id_user);

    // For querying by service ID

    // For querying by role and service ID
    List<Personnel> findByServiceId(String serviceId);
    List<Personnel> findByService(Service service);

    List<Personnel> findByAccountLocked(boolean locked);

    List<Personnel> findByActive(boolean active);
    List<Personnel> findByRole(String role);
    boolean existsByEmail(String email);
    // For getting the last matricule
    Optional<Personnel> findTopByOrderByMatriculeDesc();
    List<Personnel> findByRoleAndService(String role, Service service);


    List<Personnel> findByRoleAndServiceId(String role, String serviceId);


    // Special query for collaborators
    @Query("{ 'service.$id': ObjectId(?0), 'role': 'collaborateur' }")
    List<Personnel> findCollaboratorsByServiceId(String serviceId);
}