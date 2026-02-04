# Development Guide for GitHub Copilot Users

This guide helps you use GitHub Copilot effectively when working on the Product Builder app.

## 🎯 Understanding the Architecture

Before coding, understand these core principles:

1. **AI never generates geometry** - It only creates structured JSON constraints
2. **Python engines are stateless** - Each run is independent with JSON input
3. **Clean separation** - Frontend → API → Orchestrator → Engines (no shortcuts)
4. **Child processes** - Python scripts communicate via stdin/stdout JSON

## 💡 Copilot Prompt Patterns

### When Adding Features

**For Server-Side Work:**

```
// Add endpoint to retrieve build history for a user
// Should return array of past builds with timestamps and file paths
```

**For CAD Engine Work:**

```
# Add support for cylindrical shapes in FreeCAD generator
# Accept "shape_type": "cylinder" with diameter and height
# Maintain existing box shape logic as default
```

**For Frontend Work:**

```
// Add file size display for generated STL files
// Fetch size from server and show in human-readable format (KB/MB)
```

### When Fixing Bugs

**Validation Issues:**

```
// Fix validator to accept metric and imperial PCB trace widths
// Current min is 0.15mm, need equivalent for inches (0.006")
```

**Integration Issues:**

```
// Debug orchestrator child process communication
// Python script output isn't being parsed correctly
// Add better error handling for JSON parse failures
```

## 🔍 File-by-File Guidance

### server/services/orchestrator.js

"Coordinate AI planner and CAD/PCB generators using async child processes"

When editing:

- Always handle both stdout and stderr
- Parse JSON only after process exits with code 0
- Timeout child processes after reasonable duration
- Log intermediate steps for debugging

### engine/cad/freecad_generator.py

"Generate parametric CAD solids from JSON constraints and export STL/STEP"

When editing:

- Never use AI to generate FreeCAD code - use FreeCAD API
- Always convert units to mm (FreeCAD default)
- Include mock mode for systems without FreeCAD
- Return JSON result to stdout, errors to stderr

### client/src/components/CanvasView.jsx

"3D preview using React Three Fiber to display STL files"

When editing:

- Use @react-three/drei helpers for common 3D interactions
- Handle STL loading errors gracefully
- Consider performance with large mesh files
- Add user controls (zoom, rotate, wireframe toggle)

## 🧪 Testing Patterns

### Test Backend Endpoints

```bash
# Use Copilot to generate curl commands
curl -X POST http://localhost:3001/api/build \
  -H "Content-Type: application/json" \
  -d '{"prompt": "test enclosure 50x50x20mm"}'
```

### Test Python Generators Directly

```bash
# Test CAD generator with sample JSON
echo '{"product_type":"box","units":"mm","length":50,"width":50,"height":20}' | \
  python engine/cad/freecad_generator.py test-run
```

### Test React Components in Isolation

```javascript
// Ask Copilot: "Create Storybook story for PromptInput component"
// Or use React Testing Library
```

## 🚨 Common Pitfalls to Avoid

### ❌ Don't Do This:

```javascript
// WRONG: Calling FreeCAD directly from Node.js
const freecad = require("freecad"); // Doesn't exist!
freecad.createBox(10, 10, 10);
```

### ✅ Do This Instead:

```javascript
// RIGHT: Spawn Python child process
const pythonProcess = spawn("python", [
  "engine/cad/freecad_generator.py",
  buildId,
]);
pythonProcess.stdin.write(JSON.stringify(designData));
```

### ❌ Don't Do This:

```python
# WRONG: Having AI generate FreeCAD geometry code
box_code = ai_model.generate("create a box in freecad")
exec(box_code)  # Security risk + unreliable
```

### ✅ Do This Instead:

```python
# RIGHT: AI generates constraints, FreeCAD creates geometry
design = ai_model.extract_constraints(user_prompt)  # Returns JSON
box = Part.makeBox(design['length'], design['width'], design['height'])
```

## 📝 Code Review Checklist

When using Copilot-generated code, verify:

- [ ] No direct geometry generation by AI
- [ ] Units are validated and converted
- [ ] Error handling for child processes
- [ ] JSON parsing with try/catch
- [ ] CORS headers for file downloads
- [ ] Validation before engine calls
- [ ] Logging for debugging
- [ ] Mock mode for missing dependencies

## 🔧 Useful Copilot Chat Commands

```
@workspace How does the orchestrator coordinate CAD and PCB generation?

@workspace Where should I add validation for new feature X?

@workspace Show me all places where units conversion happens

@workspace Explain the data flow from prompt to STL file
```

## 🎨 Design Pattern References

### Adding a New Feature Type

1. Update AI prompt in `server/services/aiPlanner.js`
2. Add validation in `server/services/validator.js`
3. Extend schema in `engine/parser/schema.py`
4. Implement in `engine/cad/freecad_generator.py`
5. Update UI in `client/src/components/`

### Adding a New File Format

1. Update Python generator to export new format
2. Modify orchestrator to handle new file type
3. Add download link in `BuildStatus.jsx`
4. Update validation if needed

## 📚 Reference Documentation

- **FreeCAD Python API**: https://wiki.freecadweb.org/Python_scripting_tutorial
- **KiCad Python API**: https://docs.kicad.org/doxygen-python/
- **React Three Fiber**: https://docs.pmnd.rs/react-three-fiber
- **Anthropic API**: https://docs.anthropic.com/

## 🤝 Contributing Guidelines

When submitting changes:

1. Follow the existing architecture patterns
2. Add comments explaining "why" not "what"
3. Test with mock mode (no FreeCAD/KiCad)
4. Update relevant documentation
5. Use descriptive commit messages

---

**Pro Tip**: Use `@workspace` in Copilot Chat to ask architecture questions before coding!
