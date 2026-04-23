---
title: CSS orientado a objetos (OOCSS)
date: 2011-09-23
tags: [css, css3, html, html5, oocss, webcat]
categories: [Design, UI/UX]
originalUrl: "https://xarop.com/oocss/"
---

## WEBCAT

Ayer asistí al [webcat de Septiembre](http://lanyrd.com/2011/webcat-september/ "webcat septiembre 2011"), un **evento mensual en Barcelona dirigido a diseñadores y programadores web** dónde ellos  mismos proponen un tema durante el mes y lo exponen ese día ante toda la concurrencia, con la única premisa que la exposición no exceda de loa 10 minutos. 10 minutos son pocos, pero conden mucho ya que las presentaciones suelen ser muy preparadas y dinámicas, y luego de ellas hay un turno de preguntas que enriquezen mucho mas lo expuesto.

## OOCSS

## ![OOCSS](http://www.xarop.com/wp-content/uploads/2011/09/oocss1-300x174.gif "OOCSS Object Oriented CSS")

Entre otros temas muy interesante (distribuciones de Drupal, desarrollo agil, tipografia y css, ...) [Harold Dennison](http://hdennison.com "hdennison.com/") nos hizo una interesante introducción sobre el **[OOCSS](https://github.com/stubbornella/oocss/wiki/ "GitHub")** (Object Oriented CSS), el CSS orientado a objetos. [Nicole Sullivan](http://www.stubbornella.org "stubbornella.org") es la promotora de esta "filosofia" que en principio esta **pensada para optimizar código** y ahorrar miles de líneas y por tanto Kb y tiempos de carga y respuesta a grandes webs al estilo de Yahoo o Amazon. En definitiva la pràctica se trata de optimizar el código CSS y reutilizarlo. Normalmente tendemos a focalizar esta optimización en el código HTML, nos gusta sencillo, limpio y con las menos lineas posibles y esto suele generar un CSS mas complejo y generalmente lo que ganamos, en cuanto Kb, en el HTML lo perdemos en el CSS.

### Reutilizar

Solemos crear el CSS siguiendo la semántica HTML del sitio, y creamos estilos asociados a los diversos tags HTML. OOCSS propone **separar la estructura (HTML) del *skin* (CSS)** y utilizar y reutilizar al máximo las clases. Por ejemplo en vez de definir h2 {font-size:2em;} utilizar una clase .big{font-size:2em;} y alplicarla <h2 class="big">. En principio puede parecer más código, pero si reutilizamos esta clase en otras partes de nuestro *site* nos podemos ahorrar líneas. Puede uqe para sitios muy sencillos no ganemos mucho, o incluso compliquemos el HTML un poco, pero creo que es una técnica que nos ayudará a estructurar mejor nuestros diseños. Para mas información podeis visitar la web de Nicole, [http://www.stubbornella.org](http://www.stubbornella.org/), dónde encontrareis consejos, tips y presentaciones como esta:

**[Object Oriented CSS](http://www.slideshare.net/stubbornella/object-oriented-css "Object Oriented CSS")**

View more [presentations](http://www.slideshare.net/) from [Nicole Sullivan](http://www.slideshare.net/stubbornella)

   **¿Creéis que es una buena metodología?**
