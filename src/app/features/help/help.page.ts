import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Bloque de ayuda con una lista de indicaciones. */
interface HelpSection {
  /** Título del bloque. */
  readonly title: string;
  /** Indicaciones del bloque. */
  readonly items: readonly string[];
  /** Indica si el bloque solo afecta al rol administrador. */
  readonly adminOnly?: boolean;
}

/** Pregunta frecuente. */
interface HelpFaq {
  /** Pregunta. */
  readonly question: string;
  /** Respuesta. */
  readonly answer: string;
}

/** Atajo de teclado. */
interface HelpShortcut {
  /** Tecla o combinación. */
  readonly keys: string;
  /** Qué hace. */
  readonly action: string;
}

/** Manual de usuario integrado en la aplicación. */
@Component({
  selector: 'app-help',
  templateUrl: './help.page.html',
  styleUrls: ['./help.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HelpPage {
  /** Bloques del manual. */
  readonly sections: readonly HelpSection[] = [
    {
      title: 'Primeros pasos',
      items: [
        'Inicia sesión con tu correo y tu contraseña desde la pantalla de acceso.',
        'Si no tienes cuenta, pulsa «Crear una cuenta». El correo se comprueba mientras escribes.',
        'Usa el menú lateral (escritorio) o la barra inferior (móvil) para moverte entre secciones.',
        'Cambia entre tema claro y oscuro con el botón de la cabecera.',
      ],
    },
    {
      title: 'Productos',
      items: [
        'Busca escribiendo en el cuadro de búsqueda; se filtran todas las columnas.',
        'Pulsa el encabezado de una columna para ordenar de forma ascendente o descendente.',
        'Cambia de página con los controles de paginación bajo la tabla.',
        'Exporta lo que ves con «Exportar CSV» o «Exportar PDF».',
      ],
    },
    {
      title: 'Gestión de productos',
      adminOnly: true,
      items: [
        'Pulsa «Nuevo producto» y completa nombre (único), categoría, precio y stock.',
        'Usa «Editar» en la fila para modificar un producto.',
        'Usa «Eliminar» para borrarlo; se pide confirmación antes de hacerlo.',
      ],
    },
    {
      title: 'Pedidos',
      items: [
        'Consulta producto, cantidad, total y fecha de cada pedido.',
        'La tabla ofrece las mismas herramientas de búsqueda, orden, paginación y exportación.',
      ],
    },
    {
      title: 'Dashboard',
      adminOnly: true,
      items: [
        'Consulta ingresos, pedidos, ticket medio, stock y productos con stock bajo.',
        'Filtra por rango de fechas y por categoría; todos los gráficos se actualizan al instante.',
        'La actividad reciente se actualiza en directo desde Firestore.',
        'Si un bloque falla, pulsa «Reintentar»: el resto del panel sigue funcionando.',
      ],
    },
    {
      title: 'Informes',
      items: [
        '«Exportar CSV» descarga un archivo compatible con Excel (separador «;» y UTF-8).',
        '«Exportar PDF» genera un informe con cabecera, fecha, filtros aplicados y paginación.',
      ],
    },
  ];

  /** Atajos de teclado disponibles. */
  readonly shortcuts: readonly HelpShortcut[] = [
    { keys: 'Tab / Mayús + Tab', action: 'Moverse entre elementos interactivos' },
    { keys: 'Enter o Espacio', action: 'Activar botones, enlaces y casillas' },
    { keys: 'Esc', action: 'Cerrar un diálogo' },
    { keys: 'Tab (al cargar la página)', action: 'Mostrar el enlace para saltar al contenido' },
  ];

  /** Preguntas frecuentes. */
  readonly faqs: readonly HelpFaq[] = [
    {
      question: 'No veo el Dashboard',
      answer: 'El Dashboard solo está disponible para el rol Administrador. Si necesitas acceso, usa una cuenta de administrador.',
    },
    {
      question: 'Aparece «Revisa tu conexión» al entrar',
      answer: 'Comprueba tu conexión a internet y vuelve a intentarlo. Si persiste, recarga la página.',
    },
    {
      question: 'La exportación no descarga nada',
      answer: 'Comprueba que el navegador no bloquea las descargas de este sitio y vuelve a pulsar el botón.',
    },
    {
      question: '¿Los datos son reales?',
      answer: 'No. Todos los datos de la aplicación son sintéticos y se usan solo con fines de demostración.',
    },
  ];
}