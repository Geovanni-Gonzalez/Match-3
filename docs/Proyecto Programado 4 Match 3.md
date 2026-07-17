

IC- 4700 Lenguajes de Programación   Prof. Allan Rodríguez
Instituto Tecnológico de Costa Rica
Ingeniería en Computación
Lenguajes de Programación
Semestre II, 2025
## Profesor: Allan Rodríguez Dávila
## Proyecto Programado #4
## Match-3
## Introducción
Los juegos en  línea han  sido desarrollados  y
distribuidos  por diferentes  empresas desde
mucho    tiempo    atrás,    desde    al    Tetris,
pasando por el Match 3, hasta muchos otros.
Es  probable  que  el  nombre  de  Match-3 no
sea  muy  conocido,  pero existe  una  serie  de
juegos    basados    en    este    con    diferentes
nombres comerciales.

Un  juego  de  tipo  Match-3  es  un “puzzle” en
el  que  el  objetivo  es  formar  combinaciones
de  tres  o  más  fichas  de  un  mismo  tipo  o
color. En otras palabras, es lo que se juega en
aplicaciones  como Candy  Crush o Fruit  Pop,
por   ejemplo.   El   desafío   en   este   tipo   de
juegos  está  en  la  capacidad  para  identificar
patrones   en   medio   de   un   escenario con
diferentes figuras o colores.


¿Qué se busca con este proyecto?
El objetivo general de este proyecto es desarrollar una mejor herramienta Web para el desarrollo
de un juego en línea desde la perspectiva de la programación orientada a objetos, la investigación
de estrategias de manejo de concurrencia y multiusuarios; de manera que las partes de la lógica y
datos  (Backend) que  lo  enmarcan  sean  diseccionadas  minuciosamente  para  desarrollar  una
solución web  (Frontend). El  Backend  deberá  desarrollarse  con  .Net  Core (C#) o  Node  js  (Express)
aplicando  orientación  a  objetos y  el  Frontend  deberá  desarrollarse  con React,  Vue.js,  Angular  o
Net –Asp.Net– (manteniendo  la  separación  de  proyectos). Puede  utilizar  un  motor  de  base  de
datos libre para mantener la información persistente. La información de configuración debe estar
en un archivo específico para esta finalidad.

IC- 4700 Lenguajes de Programación   Prof. Allan Rodríguez
El servidor “gaming” (Backend) y el Frontend se publicarán por medio de las herramientas Ngrok,
Localtunnel o similar para que puedan ser accesadas por medio de enlaces públicos (ip pública).
Con esto se busca:
- Practicar las habilidades de modelado de aplicaciones de software.
- Ejercitar la toma de decisiones sobre el dominio del problema y de la solución.
- Aplicar los conceptos del Paradigma Orientado a Objetos en un proyecto programado.
- Utilizar frameworks y herramientas de tendencia en el mercado.
- Fomentar el trabajo en equipo.
Proyecto a desarrollar
Se  requiere  una  investigación  acerca  de  las  funcionalidades  detalladas  de  los  juegos Match-3.
Antes de iniciar el trabajo debe analizar por completo el funcionamiento del juego, ya que lo que
se desea es reproducir el comportamiento similar (juego en línea multiusuario en tiempo real).
El juego debe disponer de las siguientes funcionalidades:
## Cliente
Se  debe  desarrollar la  funcionalidad en  la  aplicación del  cliente en  la  cual  el  usuario  pueda  elegir
entre tres opciones:
a) Crear partida
b) Unirse a una partida (jugar)
c) Ver ranking
Espacio de Juego
El  sistema  debe  tener un  espacio  de  juego  con  una dimensión  de 9x7, donde  cada  celda
representará un color o figura que se utilizará para hacer “match”. Los colores con  los  que se
permitirá formar combinaciones serán: azul, naranja, rojo, verde, amarillo y morado.

El espacio de juego (63 celdas) se “llenarán” aleatoriamente con los colores indicados.


## Autenticación
Para  ingresar  a  las  funcionalidades  del  juego,  el  usuario  deberá  autenticarse  escribiendo  un
nickname (no hay gestión de usuarios).

Crear partida
Debe   desarrollar   la   funcionalidad   para   generar   un   nuevo   juego,   donde   el   usuario   podrá
personalizar el juego por medio de las siguientes opciones:
a) Seleccionar el tipo de juego:
i. Vs:  los  usuarios juegan durante  el  tiempo  que  deseen  hasta  que se  agota una
cantidad finita de match (configurado en un archivo específico). Cuenta regresiva.
ii. Vs  Tiempo:  Se  elegirá  una  cantidad  de  minutos  que  durará  la  partida. Cuenta
regresiva en minutos y segundo.



IC- 4700 Lenguajes de Programación   Prof. Allan Rodríguez
b) Seleccionar temática:
i. El usuario selecciona la temática que desea jugar (requerido estándar), el tiempo
de la duración de la partida (opcional) y la cantidad de jugadores (mínimo dos).

c) Una  vez  creada se  generará  un  código  identificador  de  partida.  La  partida  estará  creada
por  3  minutos  (esto  deberá  ser  un  parámetro  de  configuración),  si  en  ese  tiempo  no  es
iniciada (debe “arrancar” el juego), la partida se cancela.


Unirse a juego (partida)
Los usuarios tendrán la funcionalidad unirse a una partida:
se les muestra a los  usuarios la  lista  de  partidas  por  iniciar  con  su  información: identificador de
juego, tiempo  restante  de  vida, temática,  tiempo*,  cantidad  de  usuario y  los usuarios  unidos
(deberá  irse  actualizando  conforme  se  unan). La  página  actualizará  constantemente  las  partidas,
su información y sus usuarios unidos. Los usuarios estarán a la espera de completar los usuarios de
la partida.

Una vez que se completen los usuarios en una partida se habilitará un botón para “entrar” al
juego, posteriormente al darle entrar, a todos los usuarios se les carga la partida de juego (espacio
matricial con celdas coloreada). Para iniciar se debe presionar la tecla u, antes de esto no se podrá
hacer combinaciones. Y se darán 3 segundos para arrancar (se debe indicar a todos los usuarios el
arranque), cuenta regresiva a todos los usuarios.

## Juego:
El área de juego debe disponer de lo siguiente (en tiempo real y concurrente):
a) Un  área  para  poder  jugar(matriz),  donde  inicialmente  se  muestran las  celdas  con  un  color; a
cada una que se le asigna aleatoriamente el color.
Cada jugador selecciona una celda a la vez (clic). Cada vez que un usuario selecciona una celda
a los otros jugadores se les bloquea de forma visual (no lo pueden seleccionar).
Si el jugador toca una celda que ha seleccionado previamente se “libera” la selección.
Se  debe  visualizar:  celdas  libres,  celda  seleccionada  por  el  jugador  y  celda  seleccionada  por
otro jugador.
Para “activar” la  selección  de  la  combinación hecha  se debe  presionar  un  botón o  existir  un
mecanismo  por  tiempo  para  activarla  (luego  de  2  segundos  sin  seleccionar  nueva  celda  se
activa la selección).
b) Gestionar juego combinaciones:
El sistema permitirá gestionar combinaciones  de un mismo color de  forma en que  dos celdas
se  consideran parte de  una combinación si son del mismo color y están adyacentes de  forma
vertical, horizontal o diagonal.
Las combinaciones o “match” deben ser  de mínimo 3 celdas, donde  entre todas se  logra una
“combinación en cadena”.
Si al “activar” una combinación esta es válida se contabilizan los puntos al jugador, se libera la
selección y las celdas se rellenan con color aleatoriamente.
El puntaje de combinaciones será de la siguiente forma:
- La  combinación  suma al  puntaje  el  resultado  del cálculo  de n
## 2
. Ejemplo:  3  celdas
suma 9 al puntaje, 4 suma 16, 5 suma 25 y así sucesivamente.


IC- 4700 Lenguajes de Programación   Prof. Allan Rodríguez
c) Se  debe  visualizar  un  cronómetro  que  indique  el  tiempo  restante o  la  cantidad  de  match
pendientes.
d) Nombre de cada jugador en la partida con los puntos obtenidos parcialmente.
e) Indicar gane: el sistema debe validar, terminado el tiempo, el ganador (puede existir empate).
Estadísticas por juego:
Por cada juego se debe indicar lo siguiente:
a) Nombre de jugadores y su puntaje, ordenado descendentemente
b) Temática
c) Identificador de partida


Ranking (histórico de partidas):
Se debe mostrar información de los ganadores de cada partida. Por cada juego se debe mostrar la
siguiente información:
a) Nombre del ganador
b) Puntaje
c) Temática
d) Tiempo invertido
e) Identificador de partida
## Puntos Extra
Las siguientes características no son obligatorias, pero se asignarán puntos extras en caso de que
se desarrollen.
- Se darán 2.5  puntos  adicionales al entregar a más tardar el miércoles 19 de noviembre a
las  11:55:55  PM  el  Documento  de  Requerimientos,  ver  plantilla  suministrada  en  el  Tec
Digital.  Debe  subirse  en  la  documentación llamada “Proyecto Programado 4 (archivos
adicionales)” debajo de la carpeta de “Proyectos”.
- Habilitar diferentes temáticas de juego (4 ptos por temática adicional, máximo 2, siempre
que se permita jugar).
- El  profesor  valorará  el  desarrollo  de  las  funcionalidades  del  proyecto,  uso  de  buenas
prácticas, usabilidad, diseño, entre otros, y podrá brindar puntos adicionales.
Aspectos técnicos
Se debe generar al menos dos aplicaciones:
a) Servidor  de  juego:  es  quien  centraliza  las  funcionalidades  y  permite  la  sincronización  de
clientes.   Debe   exponer   web   services   a   los   clientes   para   que   se   pueda   generar   la
interacción y simultaneidad en los usuarios de la partida. Es quién tiene los parámetros de
configuración variables.
b) Cliente:  aplicación  web  con  interfaz,  que  permite  exponer  el  juego  a  los  usuarios,  se
conecta con el servidor para la generación de partidas y juego en línea. Puede ser accedida
por  múltiples  usuarios.  Debe  generar  mecanismo,  en  conjunto  con  el  servidor,  para  dar
experiencia de simultaneidad (concurrencia en tiempo real).
c) Los  estudiantes  deberán  analizar  las  diferentes  posibilidades  de  herramientas,  valorando
sus ventajas y eligiendo las que mejor de adaptan.


IC- 4700 Lenguajes de Programación   Prof. Allan Rodríguez
Deberán  utilizar  el  sistema  de  control  de  versiones  GitHub,  el  repositorio  deberá  ser  público  o
incluir al profesor en el control de acceso de este.


## Documentación
La   documentación   es   un   aspecto   de   gran   importancia   en   el   desarrollo   de   programas,
especialmente en tareas relacionadas con el mantenimiento de los mismos.
Para  la  documentación  interna,  deberán  incluir  comentarios  descriptivos  para  cada  función,  con
sus entradas, salidas, restricciones y objetivo.
La documentación externa deberá incluir:
## 1. Portada.
- Manual de usuario: instrucciones de compilación, ejecución y uso.
- Pruebas de funcionalidad: incluir screenshots.
- Descripción del problema.
- Diseño del programa: diagrama de paquetes, de distribución y de comunicación.
- Librerías usadas: configuración, comunicación, etc.
- Análisis de resultados: objetivos alcanzados, objetivos no alcanzados, y razones por las
cuales no se alcanzaron los objetivos (en caso de haberlos).
- Descripción manual de los principales algoritmos.
- Bitácora (autogenerada en git, commit por usuario incluyendo comentario)

Forma de trabajo
El trabajo se debe realizar en grupos de tres personas.

## Evaluación
La evaluación se va a centrar en dos elementos: programación y documentación.
La tarea tiene un valor de 15% de la nota final, en el rubro de Proyectos.
Desglose de la evaluación de la tarea programada:
- Documentación interna 2 puntos.
- Documentación externa 8 puntos.
- Funcionalidad 80 puntos.
- Revisión del proyecto (según completitud del proyecto y gestión del tiempo) 5 puntos.
- Hora de Entrega 5 puntos.

IC- 4700 Lenguajes de Programación   Prof. Allan Rodríguez
Aspectos administrativos
Debe crear un archivo .zip (“PP4_Integrante1_Integrante2.zip”) que contenga únicamente
un archivo info.txt y 2 carpetas llamadas documentacion y programa, en la primera
deberá incluir el documento de word o pdf solicitado y en la segunda los archivos y
carpetas necesarias para la implementación de este proyecto programado, y/o link en git
del repositorio. El archivo info.txt debe contener la siguiente información (cualidades):
a. Nombre del curso
b. Número de semestre y año lectivo
c. Nombre de los Estudiantes
d. Número de carnet de los estudiantes
e. Número del proyecto programado
f. Fecha de entrega
g. Estatus de la entrega (debe ser CONGRUENTE con la solución entregada):
[Deplorable|Regular|Buena|MuyBuena|Excelente|Superior]
## Entrega
Deberá  subir  el  archivo  antes  mencionado  al  TEC  Digital  en  el  curso  de  LENGUAJES  DE
PROGRAMACIÓN GR 60, en la asignación llamada “P4” debajo del rubro de “Proyectos”.
En la evaluación del Proyecto el rubro de “Hora de Entrega” valdrá por 5 puntos de la nota
total del proyecto, según la siguiente escala:
a. Si se entrega antes de las 11:55:55 PM del miércoles 03 de diciembre de 2023, 5
puntos.

NO SE ACEPTARÁN trabajos que contengan “commits” posterior a esta fecha.

Todo el contenido de cada proyecto debe ser 100% original y en caso de plagio todos los
integrantes del grupo tendrán nota cero.
Todos los miembros del grupo deberán participar de la revisión, ya que de lo contrario no
se les asignará el puntaje correspondiente. Los estudiantes deben demostrar la autoría del
proyecto por medio de la “defensa” del mismo.


IC- 4700 Lenguajes de Programación   Prof. Allan Rodríguez
## Referencias
Qué  son  los  juegos  tipo  Match-3. https://www.malavida.com/es/articulos/que-son-los-
juegos-tipo-match-3
Top  4  Best  Ngrok  Alternatives  in  2023. https://www.softwaretestinghelp.com/ngrok-
alternatives/
Ngrok. https://ngrok.com/product
Localtunnel, Expose yourself to the world. https://theboroer.github.io/localtunnel-www/
‘Ngrok’: una herramienta con la que hacer público  tu  localhost  de  forma  fácil  y  rápida.
https://sdos.es/blog/ngrok-una-herramienta-con-la-que-hacer-publico-tu-localhost-de-
forma-facil-y-rapida
