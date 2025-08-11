# Testing Guide - Next Step Paws

This document outlines the comprehensive testing strategy and setup for the Next Step Paws dog training application.

## 🧪 Testing Overview

Our testing strategy includes:
- **Unit Tests**: Individual component and function testing
- **Integration Tests**: User workflow and component interaction testing
- **API Tests**: Backend endpoint and business logic testing
- **Type Checking**: TypeScript compilation and type safety
- **Linting**: Code quality and style consistency
- **Coverage Reports**: Code coverage analysis and reporting

## 📋 Test Structure

```
src/
├── components/
│   ├── Login.test.tsx
│   ├── UserProfile.test.tsx
│   ├── GroupClasses.test.tsx
│   ├── Calendar.test.tsx
│   └── ContactUs.test.tsx
├── __tests__/
│   └── integration/
│       └── UserWorkflow.test.tsx
├── utils/
│   ├── testUtils.ts
│   └── localStorage.test.ts
└── setupTests.ts

api/src/
└── __tests__/
    └── routes/
        └── auth.test.ts
```

## 🚀 Running Tests

### Frontend Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:ci

# Run comprehensive test suite
npm run test:all

# View coverage report
npm run test:coverage
```

### API Tests

```bash
cd api
npm test              # Run API tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage
```

### Full Validation Suite

```bash
# Run all linting, type checking, and tests
npm run validate

# Quick pre-commit checks
npm run precommit
```

## 📊 Coverage Requirements

### Frontend Coverage Thresholds
- **Lines**: 70%
- **Functions**: 70%
- **Branches**: 70%
- **Statements**: 70%

### API Coverage Thresholds
- **Lines**: 60%
- **Functions**: 60%
- **Branches**: 60%
- **Statements**: 60%

## 🧩 Test Categories

### Unit Tests

#### Component Tests
- **Login.test.tsx**: Authentication flows, form validation, error handling
- **UserProfile.test.tsx**: Profile editing, password changes, data persistence
- **GroupClasses.test.tsx**: Class enrollment, waitlist management, data display
- **Calendar.test.tsx**: Date navigation, slot selection, availability display
- **ContactUs.test.tsx**: Form submission, validation, success states

#### Utility Tests
- **localStorage.test.ts**: Data persistence, error handling, validation

### Integration Tests

#### User Workflow Tests
- **Customer Onboarding**: Signup → Waiver → Intake → Main App
- **Booking Flow**: Login → Browse Classes → Enroll → Confirmation
- **Profile Management**: Login → Edit Profile → Save Changes
- **Navigation**: State persistence, route changes, session management

### API Tests

#### Authentication Tests
- User registration and validation
- Login with correct/incorrect credentials
- Error handling and edge cases

## 🛠 Testing Tools

### Core Testing Libraries
- **Jest**: Test runner and assertion library
- **React Testing Library**: Component testing utilities
- **@testing-library/user-event**: User interaction simulation
- **Supertest**: API endpoint testing
- **ts-jest**: TypeScript support for Jest

### Code Quality Tools
- **ESLint**: Code linting and style checking
- **TypeScript**: Type checking and compilation
- **Jest Coverage**: Code coverage analysis

### CI/CD Integration
- **GitHub Actions**: Automated testing pipeline
- **Coverage Reports**: Codecov integration
- **Docker Testing**: Container build validation

## 📝 Writing Tests

### Component Test Example

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('should handle user interaction', async () => {
    const user = userEvent.setup();
    const mockOnClick = jest.fn();
    
    render(<MyComponent onClick={mockOnClick} />);
    
    await user.click(screen.getByText('Click me'));
    
    expect(mockOnClick).toHaveBeenCalled();
  });
});
```

### API Test Example

```typescript
import request from 'supertest';
import app from '../app';

describe('POST /api/auth/login', () => {
  it('should authenticate valid user', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
  });
});
```

## 🔧 Test Utilities

### Custom Test Utilities (`testUtils.ts`)
- **mockLocalStorage()**: Mock browser localStorage
- **mockWindowAlert()**: Mock alert dialogs
- **sampleUsers**: Predefined test user data
- **sampleGroupClasses**: Test class data
- **waitForAsync()**: Async operation helpers

### Custom Jest Matchers
- **toBeValidDate()**: Validate Date objects
- **toHaveValidEmail()**: Validate email format

## 🎯 Test Best Practices

### 1. Test Organization
- Group related tests with `describe` blocks
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)

### 2. Mocking Strategy
- Mock external dependencies (localStorage, APIs)
- Use jest.fn() for function mocks
- Reset mocks between tests

### 3. User-Centric Testing
- Test user interactions, not implementation details
- Use semantic queries (getByText, getByRole)
- Test accessibility features

### 4. Coverage Goals
- Focus on critical user paths
- Test error conditions and edge cases
- Maintain minimum coverage thresholds

## 🚨 Troubleshooting

### Common Issues

#### Tests Failing in CI
```bash
# Check for timing issues
npm run test:ci -- --verbose

# Run tests with increased timeout
npm run test:ci -- --testTimeout=10000
```

#### Coverage Below Threshold
```bash
# Generate detailed coverage report
npm run test:coverage

# Check uncovered lines
open coverage/lcov-report/index.html
```

#### Mock Issues
```bash
# Clear Jest cache
npx jest --clearCache

# Run tests with no cache
npm test -- --no-cache
```

## 📈 Continuous Integration

### GitHub Actions Workflow
The CI pipeline automatically:
1. Runs linting and type checking
2. Executes all tests with coverage
3. Builds the application
4. Runs security audits
5. Generates coverage reports
6. Deploys on successful builds

### Build Integration
Tests are automatically run before builds:
```bash
npm run build  # Runs tests first, then builds
```

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [TypeScript Testing](https://kulshekhar.github.io/ts-jest/)

## 🤝 Contributing

When adding new features:
1. Write tests first (TDD approach)
2. Ensure coverage thresholds are met
3. Run the full validation suite
4. Update this documentation if needed

```bash
# Before committing
npm run validate
```

## 📞 Support

For testing-related questions or issues:
- Check the troubleshooting section above
- Review existing test examples
- Create an issue with detailed reproduction steps
