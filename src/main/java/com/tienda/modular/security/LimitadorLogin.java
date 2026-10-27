package com.tienda.modular.security;

import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Limite de intentos de inicio de sesion contra fuerza bruta: como maximo 5 intentos fallidos
 * por direccion IP cada 15 minutos. Un inicio de sesion correcto reinicia el contador.
 * Contador en memoria (suficiente para una instancia); con varias instancias se usaria
 * una libreria como Bucket4j con almacenamiento compartido o un API Gateway.
 */
@Component
public class LimitadorLogin {

    public static final int MAX_FALLOS = 5;
    public static final Duration VENTANA = Duration.ofMinutes(15);

    private final Map<String, Deque<Long>> fallos = new ConcurrentHashMap<>();
    private final Clock reloj;

    public LimitadorLogin() {
        this(Clock.systemUTC());
    }

    LimitadorLogin(Clock reloj) {
        this.reloj = reloj;
    }

    /** true si la IP todavia puede intentar iniciar sesion. */
    public boolean permitido(String ip) {
        int[] vigentes = {0};
        // computeIfPresent es atomico por clave y elimina la entrada cuando ya no tiene fallos vigentes.
        fallos.computeIfPresent(ip, (clave, cola) -> {
            descartarVencidos(cola);
            vigentes[0] = cola.size();
            return cola.isEmpty() ? null : cola;
        });
        return vigentes[0] < MAX_FALLOS;
    }

    public void registrarFallo(String ip) {
        fallos.compute(ip, (clave, cola) -> {
            Deque<Long> actual = cola == null ? new ArrayDeque<>() : cola;
            descartarVencidos(actual);
            actual.addLast(reloj.millis());
            return actual;
        });
    }

    public void reiniciar(String ip) {
        fallos.remove(ip);
    }

    private void descartarVencidos(Deque<Long> cola) {
        long limite = reloj.millis() - VENTANA.toMillis();
        while (!cola.isEmpty() && cola.peekFirst() <= limite) {
            cola.pollFirst();
        }
    }
}
