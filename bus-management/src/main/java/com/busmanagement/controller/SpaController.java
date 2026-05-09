package com.busmanagement.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class SpaController {

    @RequestMapping(value = {
        "/", "/login", "/register", "/profile", "/change-password",
        "/admin/**", "/staff/**", "/owner/**", "/customer/**", "/oauth2/**"
    })
    public String forward() {
        return "forward:/index.html";
    }
}
