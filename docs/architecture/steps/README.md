# Display capture to audience insights

[Back to the project README](../../../README.md#display-capture-to-audience-insights)

Follow the web display from playback and camera capture through private storage, audience detection, and LLM-generated insights. Click a diagram to open it at full size.

| Step | Starts with | Flow | Diagram |
| --- | --- | --- | --- |
| **01** | Web display player | **Play content and capture a frame**<br>The display queues a playback log with a camera frame when one is available.<br>[Guide](01-display-capture/README.md) · [Mermaid source](01-display-capture/SEQUENCE.txt) | <a href="01-display-capture/diagram.png"><img src="01-display-capture/diagram.png" alt="Play content and capture a frame sequence diagram" width="480" /></a> |
| **02** | Browser queue | **Save the log and original capture**<br>The API saves playback metadata in MongoDB, uploads the JPEG to private Firebase Storage, and queues detection.<br>[Guide](02-private-storage/README.md) · [Mermaid source](02-private-storage/SEQUENCE.txt) | <a href="02-private-storage/diagram.png"><img src="02-private-storage/diagram.png" alt="Save the log and original capture sequence diagram" width="480" /></a> |
| **03** | Detection queue | **Count people and save the annotated capture**<br>Vision analyzes the stored image. The worker saves the count and the image with bounding boxes.<br>[Guide](03-people-detection/README.md) · [Mermaid source](03-people-detection/SEQUENCE.txt) | <a href="03-people-detection/diagram.png"><img src="03-people-detection/diagram.png" alt="Count people and save the annotated capture sequence diagram" width="480" /></a> |
| **04** | Admin or insights queue | **Generate and show audience insights**<br>The API sends playback context and audience metrics as text to the LLM, then saves the generated insight.<br>[Guide](04-llm-insights/README.md) · [Mermaid source](04-llm-insights/SEQUENCE.txt) | <a href="04-llm-insights/diagram.png"><img src="04-llm-insights/diagram.png" alt="Generate and show audience insights sequence diagram" width="480" /></a> |

## Android kiosk playback and offline sync

Elevator kiosks can lose signal between floors. A running Android player keeps playing previously cached media. The Firebase Realtime Database SDK holds pending playback logs on the tablet and sends them when connectivity returns. Opening the display screen from scratch requires an online playlist load. [Kiosk workflow guide](kiosk/README.md)

| Step | Guide and source | Diagram |
| --- | --- | --- |
| 01 | [Prepare and play cached media](kiosk/01-offline-playback/README.md) · [Mermaid source](kiosk/01-offline-playback/SEQUENCE.txt) | <a href="kiosk/01-offline-playback/diagram.png"><img src="kiosk/01-offline-playback/diagram.png" alt="Prepare and play cached media" width="480" /></a> |
| 02 | [Queue playback logs and sync on reconnect](kiosk/02-log-sync/README.md) · [Mermaid source](kiosk/02-log-sync/SEQUENCE.txt) | <a href="kiosk/02-log-sync/diagram.png"><img src="kiosk/02-log-sync/diagram.png" alt="Queue playback logs and sync on reconnect" width="480" /></a> |
