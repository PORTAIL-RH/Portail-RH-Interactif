package com.example.PortailRH.Config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.gridfs.GridFsTemplate;

@Configuration
public class GridFSConfig {

    @Autowired
    private MongoTemplate mongoTemplate;

    @Bean
    public GridFsTemplate gridFsTemplate() {
        return new GridFsTemplate(
                mongoTemplate.getMongoDatabaseFactory(),
                mongoTemplate.getConverter()
        );
    }
}