# Fase 9 — Contratos (resumen funcional)

> Para quien no programa. El detalle técnico está en `docs/tecnica/fase-09.md`.

- **Contratos** en el menú (también en la barra de abajo del celular): el listado con propiedad, inquilino, propietario, período, alquiler vigente y un color por estado: **verde** vigente, **amarillo** "Vence pronto" (dentro de los días de aviso de la inmobiliaria), **rojo** vencido sin renovar o rescindido, gris finalizado. Si la póliza de caución venció, aparece "Caución vencida". Filtros por estado, propiedad, inquilino y "Sólo por vencer".
- **Nuevo contrato:** un asistente de 5 pasos:
  1. la propiedad (sólo las que no tienen contrato activo); el propietario se toma de ahí y, si la propiedad no tiene, avisa y manda a asignarlo;
  2. el inquilino (sólo los que no son titulares de otro contrato) y el garante, que se precarga con el del inquilino y se puede cambiar o crear ahí mismo;
  3. alquiler inicial, moneda, tipo de actualización (ICL, IPC, fijo u otro), frecuencia y depósito;
  4. caución: si tiene seguro, la aseguradora, su email de alerta (obligatorio), número y vencimiento de la póliza;
  5. fechas de inicio y fin, observaciones y, si ya está, el PDF del contrato firmado.
     Si se sale a la mitad, al volver se ofrece seguir donde había quedado. Al crear, la propiedad pasa a "Alquilada". Los servicios (quién paga expensas, luz, etc.) se cargan en la próxima etapa.
- **Ficha del contrato:** una barra de tiempo (inicio → hoy → fin, con "X de Y meses"), las partes con link a cada ficha, las condiciones, cuándo toca el próximo aumento, la caución con el estado de la póliza ("Vence en N días" / "Póliza vencida"), el PDF del contrato y de la póliza (subir, reemplazar, ver), el historial de aumentos y los lugares para el estado mes a mes y los servicios.
- **Aplicar aumento:** con ICL o IPC el nuevo alquiler sale del índice del mes (si todavía no está cargado, avisa); con actualización fija u otra se escribe el monto. No se puede adelantar un aumento: si no corresponde todavía, avisa.
- **Rescindir:** se carga la fecha en que el inquilino avisó, se ve el cálculo de la multa (alquiler vigente, meses y días que faltaban, alquiler futuro y el 10 %) y recién después se confirma. La propiedad vuelve a "Disponible".
- **Renovar:** abre el asistente ya cargado con los datos del contrato (misma propiedad, inquilino cambiable, alquiler inicial igual al vigente, inicio al día siguiente del fin). Al confirmar se crea el contrato nuevo y el anterior queda "Finalizado".
- **Editar:** sólo observaciones, garante y caución. Montos, fechas y partes cambian con un aumento, una rescisión o una renovación, para que quede registro.
- **Configuración → Índices** (sólo administradores): la tabla de valores mensuales de ICL e IPC y el formulario para cargar el de cada mes hasta que se traigan solos. Un mes cargado no se pisa.
- Las fichas de propiedad e inquilino ahora muestran "Ver contrato" si tienen uno activo.
