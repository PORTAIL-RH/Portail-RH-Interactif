package com.example.PortailRH.Repository;

import com.example.PortailRH.Model.AdminUser;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AdminUserRepository extends MongoRepository<AdminUser, String> {

    Optional<AdminUser> findById(String id);
    Optional<AdminUser> findByMatricule(String code);
    Optional<AdminUser> findByEmail(String email); // Add this method


}
