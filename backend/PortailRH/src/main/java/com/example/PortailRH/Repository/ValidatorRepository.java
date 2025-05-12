package com.example.PortailRH.Repository;

import com.example.PortailRH.Model.Validator;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ValidatorRepository extends MongoRepository<Validator, String> {

    // Find validators by chef ID (using DBRef)
    // Method 1: Using direct field query (if storing IDs as strings)

    // Find validators by service ID (using DBRef)
    @Query("{ 'service.$id': ?0 }")
    List<Validator> findByServiceId(String serviceId);

    // Find validator by both chef and service IDs
    @Query("{ 'chef.$id': ?0, 'service.$id': ?1 }")
    Optional<Validator> findByChefIdAndServiceId(String chefId, String serviceId);

    // Find all validators with their full documents populated
    @Query(value = "{}", fields = "{ 'service': 1, 'chef': 1, 'poid': 1 }")
    List<Validator> findAllWithDetails();

    @Query("{ 'chef.$id': { $oid: ?0 } }")
    List<Validator> findByChefId(String chefId);

    // Alternative if the above doesn't work
    @Query("{ $and: [ {'chef.$ref': 'Personnel'}, {'chef.$id': { $oid: ?0 }} ] }")
    List<Validator> findByChefIdWithFullDBRef(String chefId);
    @Query("{ 'chef.$id': { $oid: ?0 } }")
    List<Validator> findByChefIdAsObjectId(String chefId);

    @Query("{ $and: [ {'chef.$ref': 'Personnel'}, {'chef.$id': ?0} ] }")
    List<Validator> findByChefIdWithDBRef(String chefId);


}