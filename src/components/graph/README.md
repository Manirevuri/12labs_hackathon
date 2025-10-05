# Video Memory Graph Implementation

This graph implementation is inspired by Supermemory's approach to visualizing textual embeddings and relationships. It creates an interactive graph visualization of video analysis memories.

## Architecture

### Core Components

1. **VideoMemoryGraph** - Main component that orchestrates the graph
2. **GraphCanvas** - SVG-based rendering component  
3. **Graph Data Hooks** - Process vector memories into graph nodes/edges
4. **Graph Interactions** - Handle pan, zoom, drag, and selection
5. **Similarity Engine** - Calculate semantic relationships

### Node Types

- **Video Node** (Purple Circle) - Central node representing the video
- **Category Nodes** (Colored Squares) - Topic categories (topic, entity, action, dialogue, etc.)
- **Sentence Nodes** (Colored Circles) - Individual memory sentences

### Edge Types

- **Video-Category** - Solid lines connecting video to categories
- **Category-Sentence** - Dotted lines from categories to sentences  
- **Sentence-Sentence** - Dashed lines showing semantic similarity
- **Search Highlights** - Orange lines highlighting search matches

### Features

- **Semantic Clustering** - Groups sentences by category around the video
- **Similarity Detection** - Connects semantically similar sentences
- **Search & Filter** - Real-time search and category filtering
- **Interactive Navigation** - Pan, zoom, drag nodes, click for details
- **Auto-Layout** - Spiral positioning with collision avoidance

### Data Flow

1. **Analysis** → **Sentence Extraction** (GPT-4o) → **Vector Embeddings** (OpenAI) → **Graph Visualization**
2. Memories are fetched from vector database filtered by video/index
3. Nodes and edges are generated based on semantic similarities
4. Interactive graph allows exploration of memory relationships

### Usage

```tsx
<VideoMemoryGraph
  videoId="video-123"
  indexId="index-456" 
  searchQuery="product launch"
  filterCategory="brand"
  onSentenceClick={(memory) => console.log(memory)}
/>
```

The graph automatically processes existing video analysis into vector memories and displays them as an interactive knowledge graph.