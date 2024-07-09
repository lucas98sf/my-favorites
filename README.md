# My Favorites

![image](https://github.com/lucas98sf/my-favorites/assets/59150606/5d94e07d-f1ec-43a5-ad41-bea610f8fcfa)

My Favorites is a web application that allows users to create a profile and select their four favorite films, anime, music, or games. Users can then share their profile with others via a unique URL.

## Features

- Create a personalized profile
- Add links to your Spotify, Steam, Letterboxd, and MyAnimeList profiles
- Get recommendations for favorites based on your linked profiles
- Select and showcase your top four favorite films, anime, music, or games
- Share your profile with others using a unique URL

## Technologies Used

- **React**
- **Next.js**
- **Tailwind CSS**
- **shadcn/ui**
- **Supabase**

## Getting Started

To get a local copy up and running, follow these simple steps:

### Prerequisites

Make sure you have the following installed on your local machine:

- Node.js (v14.x or higher)
- [Bun](https://bun.sh) (v0.1.2 or higher)

### Installation

1. **Clone the repository:**

   ```sh
   git clone https://github.com/yourusername/my-favorites.git
   cd my-favorites
   ```

2. **Install dependencies:**

   ```sh
   bun install
   ```

3. **Set up Supabase:**

   - Create a new project on [Supabase](https://supabase.io).
   - Obtain your Supabase URL and API Key.
   - Create a `.env.local` file in the root directory and add your Supabase credentials:
     ```sh
     NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
     ```

4. **Run the development server:**

   ```sh
   bun run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Usage

1. **Create your profile:**
   - Enter your name and choose your favorite film, anime, music, and game.
2. **Add your links:**

   - Provide links to your Spotify, Steam, Letterboxd, and MyAnimeList profiles for a more personalized experience.

3. **Get recommendations:**

   - Based on your linked profiles, receive recommendations for films, anime, music, and games you might enjoy.

4. **Share your profile:**
   - After creating your profile, you'll have a unique URL that you can share with others to showcase your favorites `(http://myfavorites.bio/USERNAME)`.

## Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.
