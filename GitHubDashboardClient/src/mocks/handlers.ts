import { http, HttpResponse } from 'msw';

const API_BASE_URL = 'https://localhost:5010';

export const handlers = [
  // Mock user endpoint
  http.get(`${API_BASE_URL}/api/github/users/:username`, ({ params }) => {
    const { username } = params;
    return HttpResponse.json({
      login: username,
      id: 1,
      avatar_url: 'https://avatars.githubusercontent.com/u/1?v=4',
      name: 'Test User',
      company: 'Test Company',
      blog: 'https://test.com',
      location: 'Test Location',
      email: 'test@test.com',
      bio: 'Test bio',
      public_repos: 10,
      public_gists: 5,
      followers: 100,
      following: 50,
      created_at: '2020-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    });
  }),

  // Mock repos endpoint
  http.get(`${API_BASE_URL}/api/github/users/:username/repos`, () => {
    return HttpResponse.json([
      {
        id: 1,
        name: 'test-repo',
        full_name: 'testuser/test-repo',
        private: false,
        html_url: 'https://github.com/testuser/test-repo',
        description: 'Test repository',
        fork: false,
        stargazers_count: 50,
        watchers_count: 50,
        language: 'TypeScript',
        forks_count: 10,
        open_issues_count: 2,
        default_branch: 'main',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        pushed_at: '2024-01-01T00:00:00Z',
      },
    ]);
  }),

  // Mock events endpoint
  http.get(`${API_BASE_URL}/api/github/users/:username/events`, () => {
    return HttpResponse.json([
      {
        id: '1',
        type: 'PushEvent',
        actor: {
          id: 1,
          login: 'testuser',
          display_login: 'testuser',
          avatar_url: 'https://avatars.githubusercontent.com/u/1?v=4',
        },
        repo: {
          id: 1,
          name: 'testuser/test-repo',
          url: 'https://api.github.com/repos/testuser/test-repo',
        },
        payload: {},
        public: true,
        created_at: '2024-01-01T00:00:00Z',
      },
    ]);
  }),

  // Mock dashboard endpoint
  http.get(`${API_BASE_URL}/api/github/dashboard/:username`, ({ params }) => {
    const { username } = params;
    return HttpResponse.json({
      user: {
        status: 200,
        data: {
          login: username,
          id: 1,
          avatar_url: 'https://avatars.githubusercontent.com/u/1?v=4',
          name: 'Test User',
          bio: 'Test bio',
          public_repos: 10,
          public_gists: 5,
          followers: 100,
          following: 50,
        },
      },
      repos: {
        status: 200,
        data: [
          {
            id: 1,
            name: 'test-repo',
            stargazers_count: 50,
            forks_count: 10,
            language: 'TypeScript',
          },
        ],
      },
      events: {
        status: 200,
        data: [
          {
            id: '1',
            type: 'PushEvent',
          },
        ],
      },
    });
  }),

  // Mock users list endpoint
  http.get(`${API_BASE_URL}/api/github/users`, () => {
    return HttpResponse.json([
      {
        login: 'testuser1',
        id: 1,
        avatar_url: 'https://avatars.githubusercontent.com/u/1?v=4',
        type: 'User',
      },
      {
        login: 'testuser2',
        id: 2,
        avatar_url: 'https://avatars.githubusercontent.com/u/2?v=4',
        type: 'User',
      },
    ]);
  }),
];
