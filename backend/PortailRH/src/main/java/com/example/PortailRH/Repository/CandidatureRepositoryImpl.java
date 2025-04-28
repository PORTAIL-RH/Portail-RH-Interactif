package com.example.PortailRH.Repository;

import com.example.PortailRH.Model.Candidature;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;

@Repository
public class CandidatureRepositoryImpl implements CustomCandidatureRepository {

    @Autowired
    private MongoTemplate mongoTemplate;

    @Override
    public List<Candidature> findAvailableCandidatures(Date currentDate) {
        Criteria criteria = new Criteria().orOperator(
                Criteria.where("dateFermeturePostulation").is(null),
                Criteria.where("dateFermeturePostulation").gt(currentDate)
        );
        Query query = new Query(criteria);
        return mongoTemplate.find(query, Candidature.class);
    }
}