package com.example.PortailRH.Repository;

import com.example.PortailRH.Model.Personnel;
import com.example.PortailRH.Model.Service;
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
    boolean existsByService_Id(String serviceId);

    // For querying by service ID

    // For querying by role and service ID
    List<Personnel> findByServiceId(String serviceId);
    List<Personnel> findByService(Service service);

    List<Personnel> findByAccountLocked(boolean locked);
    @Query("{ 'service.$id': { '$in': ?0 } }")
    List<Personnel> findByServiceIdIn(List<String> serviceIds);

    List<Personnel> findByActive(boolean active);
    List<Personnel> findByRole(String role);
    boolean existsByEmail(String email);
    // For getting the last matricule
    Optional<Personnel> findTopByOrderByMatriculeDesc();
    List<Personnel> findByRoleAndService(String role, Service service);
    boolean existsByServiceId(String serviceId);


    List<Personnel> findByRoleAndServiceId(String role, String serviceId);


    // Special query for collaborators
    @Query("{ 'service.$id': ObjectId(?0), 'role': 'collaborateur' }")
    List<Personnel> findCollaboratorsByServiceId(String serviceId);
}