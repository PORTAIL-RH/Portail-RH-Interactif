package com.example.PortailRH.Config;

import com.example.PortailRH.Model.Personnel;
import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.fasterxml.jackson.databind.ser.std.StdSerializer;

import java.io.IOException;

public class PersonnelReferenceSerializer extends StdSerializer<Personnel> {
    public PersonnelReferenceSerializer() {
        this(null);
    }
    public PersonnelReferenceSerializer(Class<Personnel> t) {
        super(t);
    }

    @Override
    public void serialize(Personnel value, JsonGenerator gen, SerializerProvider provider) throws IOException {
        gen.writeStartObject();
        gen.writeStringField("id", value.getId());
        gen.writeStringField("firstName", value.getPrenom());
        gen.writeStringField("lastName", value.getNom());
        gen.writeEndObject();
    }
}