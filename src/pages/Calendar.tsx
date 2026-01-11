import { useState, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import esLocale from "@fullcalendar/core/locales/es";
import { EventInput, DateSelectArg, EventClickArg, EventContentArg } from "@fullcalendar/core";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../components/ui/modal";
import { useModal } from "../hooks/useModal";
import PageMeta from "../components/common/PageMeta";
import { SkeletonLoader, ChartSkeleton } from "../components/ui/skeleton";

interface CalendarEvent extends EventInput {
  extendedProps: {
    calendar: string;
  };
}

const calendarsEvents: Record<string, string> = {
  Urgente: "danger",
  Completado: "success",
  Principal: "primary",
  Aviso: "warning",
};

const Calendar: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null
  );
  const [eventTitle, setEventTitle] = useState("");
  const [eventStartDate, setEventStartDate] = useState("");
  const [eventEndDate, setEventEndDate] = useState("");
  const [eventLevel, setEventLevel] = useState("");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const calendarRef = useRef<FullCalendar>(null);
  const { isOpen, openModal, closeModal } = useModal();

  useEffect(() => {
    // Initialize with some events
    const timer = setTimeout(() => {
      setEvents([
        {
          id: "1",
          title: "Conf. de Evento",
          start: new Date().toISOString().split("T")[0],
          extendedProps: { calendar: "Urgente" },
        },
        {
          id: "2",
          title: "Reunión",
          start: new Date(Date.now() + 86400000).toISOString().split("T")[0],
          extendedProps: { calendar: "Completado" },
        },
        {
          id: "3",
          title: "Taller",
          start: new Date(Date.now() + 172800000).toISOString().split("T")[0],
          end: new Date(Date.now() + 259200000).toISOString().split("T")[0],
          extendedProps: { calendar: "Principal" },
        },
      ]);
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    resetModalFields();
    setEventStartDate(selectInfo.startStr);
    setEventEndDate(selectInfo.endStr || selectInfo.startStr);
    openModal();
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const event = clickInfo.event;
    setSelectedEvent(event as unknown as CalendarEvent);
    setEventTitle(event.title);
    setEventStartDate(event.start?.toISOString().split("T")[0] || "");
    setEventEndDate(event.end?.toISOString().split("T")[0] || "");
    setEventLevel(event.extendedProps.calendar);
    openModal();
  };

  const handleAddOrUpdateEvent = () => {
    if (selectedEvent) {
      // Update existing event
      setEvents((prevEvents) =>
        prevEvents.map((event) =>
          event.id === selectedEvent.id
            ? {
              ...event,
              title: eventTitle,
              start: eventStartDate,
              end: eventEndDate,
              extendedProps: { calendar: eventLevel },
            }
            : event
        )
      );
    } else {
      // Add new event
      const newEvent: CalendarEvent = {
        id: Date.now().toString(),
        title: eventTitle,
        start: eventStartDate,
        end: eventEndDate,
        allDay: true,
        extendedProps: { calendar: eventLevel },
      };
      setEvents((prevEvents) => [...prevEvents, newEvent]);
    }
    closeModal();
    resetModalFields();
  };

  const resetModalFields = () => {
    setEventTitle("");
    setEventStartDate("");
    setEventEndDate("");
    setEventLevel("");
    setSelectedEvent(null);
  };

  return (
    <>
      <PageMeta
        title="Panel de Calendario | TailAdmin"
        description="Página de calendario para el panel de administración TailAdmin"
      />
      <div className="rounded-2xl border border-border-light bg-bg-main dark:border-border-dark dark:bg-white/3">
        <SkeletonLoader
          isLoading={isLoading}
          id="calendar-main"
          skeleton={<ChartSkeleton height={600} />}
        >
          <div className="custom-calendar">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              locale={esLocale}
              headerToolbar={{
                left: "prev,next addEventButton",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay",
              }}
              events={events}
              selectable={true}
              select={handleDateSelect}
              eventClick={handleEventClick}
              eventContent={renderEventContent}
              customButtons={{
                addEventButton: {
                  text: "Añadir Evento +",
                  click: openModal,
                },
              }}
            />
          </div>
        </SkeletonLoader>
        <Modal
          isOpen={isOpen}
          onClose={closeModal}
          className="max-w-175"
          showCloseButton
        >
          <ModalHeader>
            <div>
              <h5 className="mb-1 font-semibold text-text-primary modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
                {selectedEvent ? "Editar Evento" : "Añadir Evento"}
              </h5>
              <p className="text-sm text-text-secondary dark:text-text-tertiary font-normal">
                Planifica tu próximo gran momento: programa o edita un evento para mantenerte al día
              </p>
            </div>
          </ModalHeader>

          <ModalBody>
            <div className="space-y-6">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-secondary dark:text-text-tertiary">
                  Título del Evento
                </label>
                <input
                  id="event-title"
                  type="text"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="dark:bg-dark-900 h-11 w-full rounded-lg border border-border-medium bg-transparent px-4 py-2.5 text-sm text-text-primary shadow-theme-xs placeholder:text-text-tertiary focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-border-dark dark:bg-bg-dark dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
              </div>

              <div>
                <label className="block mb-4 text-sm font-medium text-text-secondary dark:text-text-tertiary">
                  Nivel del Evento
                </label>
                <div className="flex flex-wrap items-center gap-4 sm:gap-5">
                  {Object.entries(calendarsEvents).map(([key, value]) => (
                    <div key={key} className="n-chk">
                      <div
                        className={`form-check form-check-${value} form-check-inline`}
                      >
                        <label
                          className="flex items-center text-sm text-text-secondary form-check-label dark:text-text-tertiary"
                          htmlFor={`modal${key}`}
                        >
                          <span className="relative">
                            <input
                              className="sr-only form-check-input"
                              type="radio"
                              name="event-level"
                              value={key}
                              id={`modal${key}`}
                              checked={eventLevel === key}
                              onChange={() => setEventLevel(key)}
                            />
                            <span className="flex items-center justify-center w-5 h-5 mr-2 border border-border-medium rounded-full box dark:border-border-dark">
                              <span
                                className={`h-2 w-2 rounded-full bg-white ${eventLevel === key ? "block" : "hidden"
                                  }`}
                              ></span>
                            </span>
                          </span>
                          {key}
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-secondary dark:text-text-tertiary">
                  Fecha de Inicio
                </label>
                <div className="relative">
                  <input
                    id="event-start-date"
                    type="date"
                    value={eventStartDate}
                    onChange={(e) => setEventStartDate(e.target.value)}
                    className="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-border-medium bg-transparent bg-none px-4 py-2.5 text-sm text-text-primary shadow-theme-xs placeholder:text-text-tertiary focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-border-dark dark:bg-bg-dark dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-secondary dark:text-text-tertiary">
                  Fecha de Fin
                </label>
                <div className="relative">
                  <input
                    id="event-end-date"
                    type="date"
                    value={eventEndDate}
                    onChange={(e) => setEventEndDate(e.target.value)}
                    className="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-border-medium bg-transparent bg-none px-4 py-2.5 text-sm text-text-primary shadow-theme-xs placeholder:text-text-tertiary focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-border-dark dark:bg-bg-dark dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                </div>
              </div>
            </div>
          </ModalBody>

          <ModalFooter className="shrink-0">
            <button
              onClick={closeModal}
              className="flex justify-center flex-1 px-4 py-2 text-sm font-medium text-text-secondary bg-bg-main border border-border-medium rounded-lg hover:bg-bg-secondary dark:border-border-dark dark:bg-bg-dark dark:text-text-tertiary dark:hover:bg-white/3 sm:w-auto sm:flex-none"
            >
              Cerrar
            </button>
            <button
              onClick={handleAddOrUpdateEvent}
              className="flex justify-center flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg bg-brand-500 hover:bg-brand-600 sm:w-auto sm:flex-none"
            >
              {selectedEvent ? "Guardar Cambios" : "Añadir Evento"}
            </button>
          </ModalFooter>
        </Modal>
      </div>
    </>
  );
};

const renderEventContent = (eventInfo: EventContentArg) => {
  const calendarKey = eventInfo.event.extendedProps.calendar;
  const colorValue = calendarsEvents[calendarKey] || calendarKey;
  const colorClass = `fc-bg-${colorValue.toLowerCase()}`;
  return (
    <div
      className={`event-fc-color flex fc-event-main ${colorClass} p-1 rounded-sm`}
    >
      <div className="fc-daygrid-event-dot"></div>
      <div className="fc-event-time">{eventInfo.timeText}</div>
      <div className="fc-event-title">{eventInfo.event.title}</div>
    </div>
  );
};

export default Calendar;
