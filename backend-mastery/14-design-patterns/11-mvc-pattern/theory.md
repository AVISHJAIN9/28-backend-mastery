# MVC Pattern: Separating Concerns

## What is MVC?

**Model-View-Controller** is an architectural pattern that separates an application into three interconnected components to separate internal representations from information presented to the user.

## The Three Components

### 1. **Model**

Represents the data and business logic.

```javascript
class UserModel {
  async create(data) { }
  async find(id) { }
  async update(id, data) { }
  async delete(id) { }
  async validate(data) { }
}
```

### 2. **View**

Presents data to the user.

```html
<div class="user">
  <h1>{{ user.name }}</h1>
  <p>{{ user.email }}</p>
</div>
```

### 3. **Controller**

Handles user input and updates model/view.

```javascript
router.get('/users/:id', (req, res) => {
  const user = UserModel.find(req.params.id);
  res.render('user', { user });
});
```

## Flow

```
1. User interacts with View
2. View sends input to Controller
3. Controller updates Model
4. Model notifies View of changes
5. View updates display
```

## Benefits

1. **Separation of Concerns** - Each component one focus
2. **Reusability** - Models and views reusable
3. **Testability** - Easy to test each component
4. **Maintainability** - Changes isolated
5. **Scalability** - Scale each component independently

## MVC in Express.js

```javascript
// Model
const userModel = { find: async (id) => {} };

// View (Template)
// views/user.ejs

// Controller
router.get('/users/:id', async (req, res) => {
  const user = await userModel.find(req.params.id);
  res.render('user', { user });
});
```

## MVC vs MVP vs MVVM

| Pattern | Difference |  
|---------|--------|
| **MVC** | Controller updates Model and View |
| **MVP** | Presenter orchestrates everything |
| **MVVM** | ViewModel syncs with View automatically |

## Real-World Examples

- **Web Frameworks** - Django, Rails, Laravel
- **Desktop Apps** - Swing, WPF, Cocoa
- **Mobile Apps** - iOS, Android
- **Single Page Apps** - Angular, Vue, React

## Common Issues

1. **Bloated Controllers** - Controllers shouldn't have business logic
2. **Tight Binding** - View tightly coupled to Model
3. **Missing Services** - Business logic not abstracted
4. **Testing Difficulty** - Hard to test Model/View together

## Best Practices

1. Keep business logic in Model
2. Keep presentation logic in View
3. Keep control flow in Controller
4. Use Services for business logic
5. Use Repositories for data access
6. Write testable code

## Conclusion

MVC Pattern is essential for:
- Organizing application architecture
- Separating concerns clearly
- Building maintainable applications
- Following proven patterns
