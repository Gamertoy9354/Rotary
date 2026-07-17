import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, ROLE_LABELS } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';

function timeAgo(iso) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 2592000) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function PostCard({ post, onDelete }) {
  const { user, profile, isOfficer } = useAuth();
  const [likes, setLikes] = useState(post.post_likes?.length ?? 0);
  const [liked, setLiked] = useState(!!post.post_likes?.some((l) => l.user_id === user?.id));
  const [commentCount, setCommentCount] = useState(post.post_comments?.[0]?.count ?? 0);
  const [comments, setComments] = useState(null); // null = not loaded
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [zoom, setZoom] = useState(null);
  const [shareMsg, setShareMsg] = useState('');

  const authorName = post.author_profile?.full_name || post.author_name || 'Rotary Club of Bardoli';
  const canDelete = user && (post.author === user.id || isOfficer);

  async function toggleLike() {
    if (!user) { window.location.hash = ''; window.location.assign('/login'); return; }
    if (liked) {
      setLiked(false); setLikes((n) => n - 1);
      await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', user.id);
    } else {
      setLiked(true); setLikes((n) => n + 1);
      await supabase.from('post_likes').insert({ post_id: post.id, user_id: user.id });
    }
  }

  async function loadComments() {
    const next = !showComments;
    setShowComments(next);
    if (next && comments === null) {
      const { data } = await supabase
        .from('post_comments')
        .select('id, body, created_at, user_id, profiles(id, full_name, avatar_url)')
        .eq('post_id', post.id)
        .order('created_at', { ascending: true });
      setComments(data ?? []);
    }
  }

  async function submitComment(e) {
    e.preventDefault();
    const body = commentText.trim();
    if (!body || !user) return;
    setCommentText('');
    const { data, error } = await supabase
      .from('post_comments')
      .insert({ post_id: post.id, user_id: user.id, body })
      .select('id, body, created_at, user_id')
      .single();
    if (!error && data) {
      setComments((c) => [...(c ?? []), { ...data, profiles: { id: user.id, full_name: profile?.full_name, avatar_url: profile?.avatar_url } }]);
      setCommentCount((n) => n + 1);
    }
  }

  async function share() {
    const url = `${window.location.origin}/post/${post.id}`;
    const payload = { title: post.title || 'Rotary Club of Bardoli', url };
    try {
      if (navigator.share) { await navigator.share(payload); return; }
      await navigator.clipboard.writeText(url);
      setShareMsg('Link copied!');
    } catch {
      setShareMsg(url);
    }
    setTimeout(() => setShareMsg(''), 2500);
  }

  async function removePost() {
    if (!window.confirm('Delete this post permanently?')) return;
    const { error } = await supabase.from('posts').delete().eq('id', post.id);
    if (!error) onDelete?.(post.id);
  }

  return (
    <article className="card" id={`post-${post.id}`}>
      <div className="post-head">
        {post.author_profile
          ? <Link to={`/u/${post.author_profile.id}`}><Avatar profile={post.author_profile} /></Link>
          : <Avatar name={authorName} />}
        <div className="meta">
          <b>{post.author_profile
            ? <Link to={`/u/${post.author_profile.id}`}>{authorName}</Link>
            : authorName}</b>
          <span>
            {post.author_profile?.title || ROLE_LABELS[post.author_profile?.role] || 'Official Club Updates'}
            {' · '}{timeAgo(post.created_at)}
          </span>
        </div>
        {canDelete && (
          <button className="btn btn-danger btn-sm" style={{ marginLeft: 'auto' }} onClick={removePost}>
            Delete
          </button>
        )}
      </div>

      {post.title && <h3 className="post-title">{post.title}</h3>}
      {post.body && <p className="post-body">{post.body}</p>}

      {(post.group || post.project) && (
        <div className="post-tags">
          {post.group && <Link className="badge" to={`/groups/${post.group.slug}`}>{post.group.name}</Link>}
          {post.project && <Link className="badge badge-gold" to={`/projects/${post.project.slug}`}>{post.project.title}</Link>}
        </div>
      )}

      {post.images?.length > 0 && (
        <div className={`post-images ${post.images.length > 1 ? 'multi' : ''}`}>
          {post.images.map((src) => (
            <img key={src} src={src} alt={post.title || 'Post image'} loading="lazy" onClick={() => setZoom(src)} />
          ))}
        </div>
      )}

      <div className="post-actions">
        <button className={liked ? 'liked' : ''} onClick={toggleLike} aria-pressed={liked}>
          {liked ? '♥' : '♡'} {likes > 0 ? likes : ''} Like{likes === 1 ? '' : 's'}
        </button>
        <button onClick={loadComments} aria-expanded={showComments}>
          💬 {commentCount > 0 ? commentCount : ''} Comment{commentCount === 1 ? '' : 's'}
        </button>
        <button onClick={share}>↗ {shareMsg || 'Share'}</button>
      </div>

      {showComments && (
        <div className="comments">
          {(comments ?? []).map((c) => (
            <div className="comment" key={c.id}>
              <Avatar profile={c.profiles} size={32} />
              <div className="comment-bubble">
                <b>{c.profiles?.full_name || 'Supporter'}</b>
                <p>{c.body}</p>
                <small>{timeAgo(c.created_at)}</small>
              </div>
            </div>
          ))}
          {comments?.length === 0 && <p style={{ color: 'var(--ink-soft)', fontSize: '.88rem', padding: '8px 0' }}>No comments yet — start the conversation.</p>}
          {user ? (
            <form className="comment-form" onSubmit={submitComment}>
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment…"
                aria-label="Write a comment"
              />
              <button className="btn btn-blue btn-sm" type="submit" disabled={!commentText.trim()}>Post</button>
            </form>
          ) : (
            <p style={{ fontSize: '.86rem', paddingTop: 8 }}><Link to="/login">Sign in</Link> to join the conversation.</p>
          )}
        </div>
      )}

      {zoom && (
        <div className="lightbox" onClick={() => setZoom(null)} role="dialog" aria-label="Image viewer">
          <img src={zoom} alt="" />
        </div>
      )}
    </article>
  );
}

/** Shared select for feed queries so every list shows the same shape.
    Must stay single-line (PostgREST rejects whitespace/newlines) and the
    profiles embed needs the FK hint — author vs. likes is ambiguous. */
export const POST_SELECT =
  'id,title,body,images,created_at,author,author_name,' +
  'author_profile:profiles!posts_author_fkey(id,full_name,avatar_url,role,title),' +
  'group:groups(id,name,slug),project:projects(id,title,slug),' +
  'post_likes(user_id),post_comments(count)';
