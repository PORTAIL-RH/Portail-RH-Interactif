package com.example.PortailRH.Repository;

import com.example.PortailRH.Model.theme;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.ui.context.Theme;

import java.util.List;

public interface ThemeRepository extends MongoRepository<theme, String> {
    List<Theme> findByTypeId(String typeId);

}
