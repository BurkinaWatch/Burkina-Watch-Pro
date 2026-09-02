import React, { type ReactNode } from "react";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { VoiceSearchButton, VoiceSearchInput } from "./VoiceSearchButton";
import ChatBot from "./ChatBot";
import GoogleMap from "./GoogleMap";

const testMocks = vi.hoisted(() => ({
  toast: vi.fn(),
  map: {
    setView: vi.fn(),
    addLayer: vi.fn(),
    removeLayer: vi.fn(),
  },
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: testMocks.toast }),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: null }),
}));

vi.mock("react-draggable", () => ({
  default: ({ children }: { children: ReactNode }) => children,
}));

vi.mock("leaflet", () => ({
  default: {
    divIcon: vi.fn((options) => options),
    marker: vi.fn(() => ({ on: vi.fn() })),
    markerClusterGroup: vi.fn(() => ({
      addLayer: vi.fn(),
    })),
    heatLayer: vi.fn(() => ({ addTo: vi.fn() })),
  },
}));

vi.mock("leaflet.markercluster", () => ({}));
vi.mock("leaflet.heat", () => ({}));

vi.mock("react-leaflet", () => ({
  MapContainer: ({ children }: { children: ReactNode }) =>
    React.createElement("div", { "data-testid": "map-container" }, children),
  TileLayer: () => null,
  Marker: () => null,
  Circle: () => null,
  useMap: () => testMocks.map,
  useMapEvents: () => testMocks.map,
  Popup: ({
    children,
    eventHandlers,
  }: {
    children: ReactNode;
    eventHandlers?: { remove?: () => void };
  }) =>
    React.createElement(
      "div",
      { "data-testid": "map-popup" },
      children,
      React.createElement(
        "button",
        {
          type: "button",
          "data-testid": "button-close-popup",
          onClick: () => eventHandlers?.remove?.(),
        },
        "Close popup",
      ),
    ),
}));

class MockSpeechRecognition {
  continuous = false;
  interimResults = false;
  lang = "";
  maxAlternatives = 0;
  onresult: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  onend: (() => void) | null = null;
  start = vi.fn();
  stop = vi.fn();
  abort = vi.fn();

  constructor() {
    speechRecognitions.push(this);
  }
}

const speechRecognitions: MockSpeechRecognition[] = [];

function installSpeechRecognition() {
  Object.defineProperty(window, "SpeechRecognition", {
    configurable: true,
    writable: true,
    value: MockSpeechRecognition,
  });
  Reflect.deleteProperty(window, "webkitSpeechRecognition");
}

function removeSpeechRecognition() {
  Reflect.deleteProperty(window, "SpeechRecognition");
  Reflect.deleteProperty(window, "webkitSpeechRecognition");
}

function renderChatBot() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ChatBot />
    </QueryClientProvider>,
  );
}

describe("browser integrations", () => {
  beforeEach(() => {
    speechRecognitions.length = 0;
    testMocks.toast.mockReset();
    testMocks.map.setView.mockReset();
    testMocks.map.addLayer.mockReset();
    testMocks.map.removeLayer.mockReset();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [],
      }),
    );
  });

  afterEach(() => {
    cleanup();
    removeSpeechRecognition();
    vi.unstubAllGlobals();
  });

  it("passes a final voice transcript to the search callback", async () => {
    installSpeechRecognition();
    const onResult = vi.fn();
    const onListeningChange = vi.fn();

    render(
      <VoiceSearchButton
        onResult={onResult}
        onListeningChange={onListeningChange}
      />,
    );

    const voiceButton = screen.getByTestId("button-voice-search");
    await userEvent.click(voiceButton);

    expect(speechRecognitions).toHaveLength(1);
    expect(speechRecognitions[0].start).toHaveBeenCalledOnce();
    expect(onListeningChange).toHaveBeenLastCalledWith(true);

    act(() => {
      speechRecognitions[0].onresult?.({
        results: [
          {
            0: { transcript: "  Ouagadougou  ", confidence: 0.99 },
            isFinal: true,
          },
        ],
        length: 1,
      });
    });

    expect(onResult).toHaveBeenCalledWith("Ouagadougou");
    expect(onListeningChange).toHaveBeenLastCalledWith(false);
    expect(voiceButton).toHaveAttribute("aria-label", "Recherche vocale");
  });

  it("connects ChatBot speech recognition output to its message input", async () => {
    installSpeechRecognition();
    renderChatBot();

    await userEvent.click(screen.getByTestId("button-open-chatbot"));
    const voiceButton = await screen.findByTestId("button-voice-input");
    await waitFor(() => expect(voiceButton).toBeEnabled());
    await userEvent.click(voiceButton);

    expect(speechRecognitions[0].start).toHaveBeenCalledOnce();

    act(() => {
      speechRecognitions[0].onresult?.({
        results: [
          { 0: { transcript: "Ou trouver une pharmacie ?" } },
        ],
      });
    });

    expect(screen.getByTestId("input-chat-message")).toHaveValue(
      "Ou trouver une pharmacie ?",
    );
  });

  it("notifies ChatBot users when speech recognition cannot start", async () => {
    installSpeechRecognition();
    renderChatBot();

    await userEvent.click(screen.getByTestId("button-open-chatbot"));
    const voiceButton = await screen.findByTestId("button-voice-input");
    await waitFor(() => expect(voiceButton).toBeEnabled());
    speechRecognitions[0].start.mockImplementationOnce(() => {
      throw new Error("recognition is already running");
    });

    await userEvent.click(voiceButton);

    expect(testMocks.toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Impossible de démarrer la reconnaissance vocale",
        variant: "destructive",
      }),
    );
    expect(screen.getByTestId("input-chat-message")).toHaveAttribute(
      "placeholder",
      "Tapez ou parlez...",
    );
  });

  it("does not render the voice button when speech recognition is unsupported", async () => {
    removeSpeechRecognition();

    render(<VoiceSearchButton onResult={vi.fn()} />);

    await waitFor(() => {
      expect(screen.queryByTestId("button-voice-search")).not.toBeInTheDocument();
    });
    expect(speechRecognitions).toHaveLength(0);
  });

  it("notifies ChatBot users when speech recognition is unsupported", async () => {
    removeSpeechRecognition();
    renderChatBot();

    await userEvent.click(screen.getByTestId("button-open-chatbot"));
    const voiceButton = await screen.findByTestId("button-voice-input");
    await waitFor(() => expect(voiceButton).toBeEnabled());
    await userEvent.click(voiceButton);

    expect(testMocks.toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Non supporté",
        variant: "destructive",
      }),
    );
  });

  it("clears the selected marker when its map popup is closed", async () => {
    const marker = {
      id: "marker-1",
      lat: 12.3714,
      lng: -1.5197,
      categorie: "urgence" as const,
      titre: "Alerte à Ouagadougou",
    };

    render(<GoogleMap markers={[marker]} highlightMarkerId={marker.id} />);

    expect(
      await screen.findByTestId(`popup-marker-${marker.id}`),
    ).toHaveTextContent(marker.titre);

    await userEvent.click(screen.getByTestId("button-close-popup"));

    expect(screen.queryByTestId(`popup-marker-${marker.id}`)).not.toBeInTheDocument();
  });
});