# Display capture to audience insights

[Back to the project README](../../../README.md#display-capture-to-audience-insights)

Follow the web display from playback and camera capture through private storage, audience detection, and LLM-generated insights. Click a diagram to open it at full size.

| Step | Starts with | Flow | Diagram |
| --- | --- | --- | --- |
| **01** | Web display player | **Play content and capture a frame**<br>The display queues a playback log with a camera frame when one is available.<br>[Guide](01-display-capture/README.md) · [Mermaid source](01-display-capture/SEQUENCE.txt) | <a href="01-display-capture/diagram.png"><img src="01-display-capture/diagram.png" alt="Play content and capture a frame sequence diagram" width="480" /></a> |
| **02** | Browser queue | **Save the log and original capture**<br>The API saves playback metadata in MongoDB, uploads the JPEG to private Firebase Storage, and queues detection.<br>[Guide](02-private-storage/README.md) · [Mermaid source](02-private-storage/SEQUENCE.txt) | <a href="02-private-storage/diagram.png"><img src="02-private-storage/diagram.png" alt="Save the log and original capture sequence diagram" width="480" /></a> |
| **03** | Detection queue | **Count people and save the annotated capture**<br>Vision analyzes the stored image. The worker saves the count and the image with bounding boxes.<br>[Guide](03-people-detection/README.md) · [Mermaid source](03-people-detection/SEQUENCE.txt) | <a href="03-people-detection/diagram.png"><img src="03-people-detection/diagram.png" alt="Count people and save the annotated capture sequence diagram" width="480" /></a> |
| **04** | Admin or insights queue | **Generate and show audience insights**<br>The API sends playback context and audience metrics as text to the LLM, then saves the generated insight.<br>[Guide](04-llm-insights/README.md) · [Mermaid source](04-llm-insights/SEQUENCE.txt) | <a href="04-llm-insights/diagram.png"><img src="04-llm-insights/diagram.png" alt="Generate and show audience insights sequence diagram" width="480" /></a> |

## Proposed AI workflow

These steps describe the possible next architecture after detection. Steps 01–04 document the current product. See the [AI architecture proposal](../ai/README.md) for decisions, alternatives, and rollout criteria.

| Step | Starts with | Flow | Diagram |
| --- | --- | --- | --- |
| **05** | Admin or scheduler | **Register a scoped AI run**<br>Authorize the scope, reserve a run in MongoDB, and dispatch its ID.<br>[Guide](05-ai-run-intake/README.md) · [Mermaid source](05-ai-run-intake/SEQUENCE.txt) | <a href="05-ai-run-intake/diagram.png"><img src="05-ai-run-intake/diagram.png" alt="Register a scoped AI run proposed sequence diagram" width="480" /></a> |
| **06** | AI queue | **Delegate and validate the result**<br>Build an evidence snapshot, select a specialist where useful, and validate the result.<br>[Guide](06-ai-orchestration/README.md) · [Mermaid source](06-ai-orchestration/SEQUENCE.txt) | <a href="06-ai-orchestration/diagram.png"><img src="06-ai-orchestration/diagram.png" alt="Delegate and validate the result proposed sequence diagram" width="480" /></a> |
| **07** | Admin | **Review evidence and approve next actions**<br>Show run status and evidence, then record a human decision on a proposed action.<br>[Guide](07-ai-review/README.md) · [Mermaid source](07-ai-review/SEQUENCE.txt) | <a href="07-ai-review/diagram.png"><img src="07-ai-review/diagram.png" alt="Review evidence and approve next actions proposed sequence diagram" width="480" /></a> |
