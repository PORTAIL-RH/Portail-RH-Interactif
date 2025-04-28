package com.example.PortailRH.Repository;

import com.example.PortailRH.Model.Candidature;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;
@Repository

public interface CustomCandidatureRepository {
    List<Candidature> findAvailableCandidatures(Date currentDate);
}