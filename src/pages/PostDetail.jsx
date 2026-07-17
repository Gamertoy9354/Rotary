import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import PostCard, { POST_SELECT } from '../components/PostCard';
import Spinner, { Empty } from '../components/Spinner';

export default function PostDetail() {
  const { id } = useParams();
  const [post, setPost] = useState(null);

  useEffect(() => {
    supabase.from('posts').select(POST_SELECT).eq('id', id).maybeSingle()
      .then(({ data }) => setPost(data ?? false));
  }, [id]);

  if (post === null) return <main className="page"><Spinner /></main>;
  return (
    <main className="page">
      <div className="container" style={{ maxWidth: 720 }}>
        {post === false ? (
          <Empty>This post doesn't exist (it may have been deleted). <Link to="/feed">Back to the feed.</Link></Empty>
        ) : (
          <>
            <p style={{ marginBottom: 16 }}><Link to="/feed">← Back to the feed</Link></p>
            <PostCard post={post} onDelete={() => window.location.assign('/feed')} />
          </>
        )}
      </div>
    </main>
  );
}
