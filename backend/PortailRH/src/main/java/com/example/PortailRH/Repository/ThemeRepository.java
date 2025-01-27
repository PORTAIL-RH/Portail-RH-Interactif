package com.example.PortailRH.Repository;

import com.example.PortailRH.Model.theme;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface ThemeRepository extends MongoRepository<theme, String> {
}
