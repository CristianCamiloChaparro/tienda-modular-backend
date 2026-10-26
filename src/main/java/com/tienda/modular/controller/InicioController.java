package com.tienda.modular.controller;

import io.swagger.v3.oas.annotations.Hidden;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/** La raiz del backend lleva a la documentacion (el backend no tiene vistas propias). */
@Hidden
@Controller
public class InicioController {

    @GetMapping("/")
    public String inicio() {
        return "redirect:/api/v1/docs";
    }
}
