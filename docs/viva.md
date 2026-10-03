# EcoSort AI Viva Questions and Answers

These answers are intentionally short and conversational. They describe the actual EcoSort AI notebook and saved artifacts rather than a generic or invented model.

## Project overview

### What is EcoSort AI?

EcoSort AI is a Deep Learning web application that classifies one waste photograph as cardboard, glass, metal, paper, plastic, or trash. It then gives general, deterministic recycling or disposal guidance. The frontend uses Next.js, and a FastAPI backend runs the real saved Keras model.

### What problem does it solve?

It demonstrates how image classification can help a person identify a broad waste category and think about the correct waste stream. It is an educational assistant, not a replacement for local recycling rules.

### What is the main academic contribution?

The work is the complete pipeline: auditing TrashNet, preventing duplicate leakage, training and evaluating a transfer-learning model, reporting class-level limitations honestly, exposing real inference through an API, and deploying an accessible web interface.

### Which classes does the model recognize?

It recognizes six classes in this exact order: cardboard, glass, metal, paper, plastic, and trash. The order comes from `class_names.json`, so the API does not guess it.

## Deep Learning and CNN concepts

### What is Deep Learning?

Deep Learning is a part of machine learning that uses neural networks with many layers to learn useful representations directly from data. In this project, the network learns visual features from waste images.

### What is a CNN?

A convolutional neural network, or CNN, is a neural network designed to learn spatial patterns such as edges, textures, shapes, and object parts. Convolution filters can reuse the same pattern detector across different image locations.

### Why are CNNs suitable for images?

Images have local spatial structure. Nearby pixels are related, and the same feature can appear in different positions. CNNs use that structure more efficiently than treating every pixel as an unrelated input.

### What is MobileNetV2?

MobileNetV2 is an efficient CNN architecture that uses depthwise separable convolutions and inverted residual blocks. It was designed to reduce computation and model size while preserving useful image features.

### Why did you use MobileNetV2?

It gives a practical balance between accuracy and deployment cost. That matters because the model must run on a CPU-hosted web service, not only in a training notebook.

### Did you design the CNN from scratch?

No. The project openly uses MobileNetV2 with ImageNet-pretrained weights. The project-specific contribution is adapting, training, evaluating, and deploying it for six TrashNet categories.

### What is transfer learning?

Transfer learning starts with a model trained on a large source dataset and adapts it to a new task. Here, MobileNetV2 already knew general visual features from ImageNet, and the model learned a new six-class waste classifier.

### Why use ImageNet weights?

TrashNet is small, so learning every visual feature from random initialization would be difficult and more likely to overfit. ImageNet weights provide useful low- and mid-level features such as edges, textures, and shapes.

### What is feature extraction?

Feature extraction means keeping the pretrained backbone frozen and training only the new classification head. In the first stage, the backbone was frozen for 25 completed epochs with learning rate `1e-3`.

### What is fine-tuning?

Fine-tuning updates part of the pretrained backbone using a much smaller learning rate. EcoSort AI opened the last 40 backbone layers for 12 completed epochs at `1e-5`, while keeping batch-normalization layers frozen.

### Why keep batch-normalization layers frozen?

With a small dataset and batch size, updating their running statistics can destabilize pretrained features. Keeping them frozen makes fine-tuning more conservative.

### What is global average pooling?

It averages each final feature map across its spatial dimensions. That converts the MobileNetV2 feature maps into a compact vector with fewer parameters than a large flattened dense layer.

### What is dropout?

Dropout randomly disables some activations during training to reduce dependence on particular features. This model uses a dropout rate of `0.35` before its final dense layer.

### What is softmax?

Softmax converts the six output scores into values that sum to approximately one. The saved model already contains a six-unit softmax output, so the backend must not apply softmax again.

## Data and training

### Which dataset did you use?

The project used the resized TrashNet dataset. The source contained 2,527 images across the six classes.

### How did you audit the data?

The notebook checked image validity and duplicate relationships. Six images belonging to three exact cross-label duplicate groups were quarantined, leaving 2,521 usable images. No corrupt images were excluded.

### Why are cross-label duplicates a problem?

The same image under conflicting labels gives contradictory supervision. If duplicate copies are split between training and test sets, they can also inflate evaluation by leaking nearly identical content.

### How was the dataset split?

It used nested `StratifiedGroupKFold` with duplicate groups. The final sizes were 1,800 training, 360 validation, and 361 test images. Grouping kept linked duplicates together, while stratification preserved class proportions as much as possible.

### Why do we need training, validation, and test sets?

The training set updates weights. The validation set guides decisions such as candidate selection. The test set is used once for an unbiased final estimate and was not used to choose the model.

### What is data leakage?

Data leakage happens when information from validation or test data influences training or model selection. Duplicate images across splits are one example. Group-aware splitting was used to reduce that risk.

### What is data augmentation?

Data augmentation creates varied training views without changing the label. This model used horizontal flip, rotation `0.05`, translation `0.05`, zoom `0.10`, and contrast `0.10` only during training.

### Is augmentation used for uploaded images?

No. Random augmentation would make the same upload produce avoidably inconsistent inputs. Production uses only deterministic decode, orientation correction, RGB conversion, resize, dtype conversion, and the model's embedded rescaling.

### Why use class weights?

The dataset is imbalanced. For example, the usable data has 594 paper images but only 137 trash images. Class weights make errors on underrepresented training classes contribute more to the loss; the trash weight was about `3.0612`.

### How was the final model selected?

The notebook compared the initial and fine-tuned candidates on validation data. Lowest validation loss was the main criterion, and validation accuracy was the tie-breaker. The fine-tuned model had validation loss about `0.4175`, lower than the initial model's `0.5046`, so it was selected without looking at the test set.

### What is overfitting?

Overfitting happens when a model learns training-specific detail but does not generalize. Validation monitoring, augmentation, dropout, a frozen pretrained backbone, conservative fine-tuning, class weighting, and a separate held-out test set help manage it.

## Preprocessing and inference

### How is an image preprocessed?

The notebook decodes it to three channels with `tf.io.decode_image`, then resizes it to `224 x 224` using bilinear interpolation with antialiasing. The input is `float32` in raw `[0, 255]` scale. The saved model itself applies `x / 127.5 - 1` to reach `[-1, 1]`.

### What extra handling is needed for phone uploads?

The backend corrects EXIF orientation before RGB conversion and resizing. Without this, a phone image may be visually rotated even though its pixels decode successfully.

### Why must web preprocessing match training?

The model learned from a specific input distribution. A different size, channel order, scale, or normalization changes that distribution and can damage predictions even if the API still runs.

### Why is the model loaded once?

Loading TensorFlow and the Keras file is expensive in time and memory. Loading once at application startup reduces prediction latency and avoids repeating that cost for every request.

### What does the backend return?

It returns the highest-probability class, its confidence, the top three classes in descending order, an uncertainty flag, and deterministic recycling guidance. It also validates that there are six finite probability values and that the top result is the argmax.

### What happens when confidence is low?

The system still shows the model's top class but marks the result uncertain and asks for a clearer image with one centered item. The operational threshold is `0.60`.

### Is the `0.60` threshold calibrated?

No. It is a practical UI heuristic, not a statistically calibrated guarantee. A score of `0.60` should not be described as a proven 60% chance of being correct.

### Why not add an “unknown” class?

The model was trained with six classes only. Calling low confidence a seventh learned class would misrepresent what the network was trained to do.

## Evaluation

### What accuracy did the model achieve?

On the 361-image held-out test set, exact accuracy was `0.850415512465374`, or about 85.04%.

### What is precision?

Precision asks: among images predicted as a class, how many truly belonged to that class? It is important when false positives matter.

### What is recall?

Recall asks: among all real examples of a class, how many did the model find? A class can have high precision but still miss many real examples.

### What is F1-score?

F1 is the harmonic mean of precision and recall. It gives one score that becomes lower when either precision or recall is weak.

### What is macro F1?

Macro F1 averages each class's F1 equally, regardless of class size. EcoSort AI's exact macro F1 was `0.8259942272207406`, about 82.60%.

### What is weighted F1?

Weighted F1 averages class F1 scores according to their test support. Its exact value was `0.8493687824131492`, about 84.94%.

### Why is accuracy not enough?

Accuracy can hide weak performance on a small class. The model's overall accuracy was about 85%, but the trash class F1 was only `0.65`, so per-class precision, recall, F1, and support are also necessary.

### What is a confusion matrix?

It counts actual classes by predicted classes. It shows specific confusion patterns; for example, the saved test matrix shows 11 plastic images predicted as glass and nine glass images predicted as plastic.

### Why was the Trash class weaker?

Trash had much less data: 137 usable examples overall and only 20 in the test set. It is also visually broad. Class weighting helps, but it cannot replace more diverse labelled examples. Its test precision, recall, and F1 were all `0.65`.

### Which classes performed best?

Cardboard had F1 about 93.91%, and paper had F1 about 93.49%. That describes this held-out split only, not guaranteed performance for every real-world photo.

### Why can real-world accuracy differ?

Phone images can have different lighting, backgrounds, viewpoints, damage, contamination, and multiple materials. TrashNet does not cover every such condition, so held-out dataset performance may not transfer exactly.

### Is confidence the same as accuracy?

No. Confidence is the model's score for one input. Accuracy summarizes results across a labelled dataset. Neural networks can also be confidently wrong, especially on unfamiliar inputs.

## Application architecture

### Why use FastAPI?

FastAPI fits Python-based model serving, supports typed request and response schemas, provides clear validation, and works well with Uvicorn for a small inference API.

### Why use Next.js?

Next.js provides a structured React application, TypeScript support, responsive component composition, production builds, and straightforward deployment on Vercel.

### Why use Render for the backend?

The backend needs a long-running Python process that loads TensorFlow and the model once. Render supports that web-service pattern and injects the port required by the service.

### Why use Vercel for the frontend?

Vercel is well suited to Next.js builds and global frontend delivery. The frontend remains separate from the heavier Python ML runtime.

### Why is a database not needed?

Inference is stateless. An image arrives, is processed transiently for one request, and a response is returned. Application code does not persist the upload; the multipart layer may temporarily spool a request while decoding it. The project has no accounts, saved history, or user-owned records that require persistence.

### What is CORS and why is it needed?

CORS controls which browser origins can call the API. Local development allows the local frontend, while production allows the canonical Vercel origin through environment configuration rather than using a wildcard.

### How are uploads secured?

The API accepts JPEG, PNG, and WEBP up to 8 MiB, verifies the actual image content, rejects corrupt or excessive images, handles decompression-bomb risk, processes bytes in memory, and does not trust the supplied filename as a filesystem path.

### Are uploaded images stored?

No application storage is required. Images are processed transiently for the current request and are neither retained nor logged as raw data by application code.

### What is a backend cold start?

On no-cost hosting, an idle service may sleep. The first request then waits for Python, TensorFlow, and the model to start. The UI explains this and uses a sensible timeout instead of a fake progress countdown.

### Why use deterministic recycling recommendations?

The recommendation depends only on the predicted class, so it is consistent, testable, and does not pretend another AI knows local law. The wording always tells users to check local policy.

### What happens if the backend is unavailable?

The frontend shows a clear unavailable or retry message. It never replaces the real classifier with a random, hard-coded, JavaScript, or LLM-generated guess.

## Limitations and responsible use

### What are the main limitations?

There are only six classes, the dataset is small and imbalanced, and mixed materials are difficult. Poor lighting, clutter, unusual angles, partial visibility, dirt, and damage can also affect predictions. Confidence is not a guarantee.

### Can it identify hazardous waste?

No. It performs broad visual classification and should not be used as the sole authority for batteries, chemicals, electronics, medical waste, or hazardous material.

### Does a Plastic prediction mean the item is recyclable?

No. Plastic acceptance depends on resin type, format, contamination, and local facilities. The interface advises the user to check markings and local rules.

### How would you improve the project?

I would collect a larger and more balanced real-world dataset, evaluate more camera and lighting conditions, calibrate probabilities on dedicated data, and explore segmentation or multi-label prediction for scenes containing several materials.

### Could you use TFLite or ONNX?

Yes, but only if direct Keras inference causes a real hosting problem. I would preserve the Keras model, use a reproducible conversion, compare probabilities on identical real images, and require top-class and class-order parity before deployment.

### How do you prove the deployed application is real?

I call live health and model-information endpoints, submit a genuine image to the deployed prediction endpoint, and then repeat the flow through the public frontend. A “deployed” dashboard state or a blank test image is not proof of real classification.
