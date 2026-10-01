import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Users,
  Plus,
  Trash2,
  Edit2,
  X,
  Sparkles,
  RotateCcw,
  Heart,
  Swords,
  Shield,
  GraduationCap,
  Flame,
  KeyRound,
  Compass,
  ArrowRight,
  Info,
  Check,
  Loader2,
} from 'lucide-react';
import { Character, CharacterRelationship, RelationshipType } from '../types/novel';
import { requestAIAssist } from '../services/aiService';

interface CharacterRelationshipMapProps {
  characters: Character[];
  relationships: CharacterRelationship[];
  novelTitle: string;
  genre: string;
  onUpdateRelationships: (relationships: CharacterRelationship[]) => void;
  onSelectCharacter?: (character: Character) => void;
  externalOpenAddModalTrigger?: number;
}

interface NodePosition {
  x: number;
  y: number;
}

export const CharacterRelationshipMap: React.FC<CharacterRelationshipMapProps> = ({
  characters,
  relationships,
  novelTitle,
  genre,
  onUpdateRelationships,
  onSelectCharacter,
  externalOpenAddModalTrigger,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [positions, setPositions] = useState<Record<string, NodePosition>>({});
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Filter state
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [hoveredRelId, setHoveredRelId] = useState<string | null>(null);

  // Modals state
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingRel, setEditingRel] = useState<CharacterRelationship | null>(null);

  // New relationship form state
  const [sourceId, setSourceId] = useState<string>('');
  const [targetId, setTargetId] = useState<string>('');
  const [relType, setRelType] = useState<RelationshipType>('friend');
  const [relLabel, setRelLabel] = useState<string>('');
  const [relNotes, setRelNotes] = useState<string>('');

  // AI Suggestions state
  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Initialize circular layout
  useEffect(() => {
    if (characters.length === 0) return;

    const width = 800;
    const height = 550;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 100;

    const initialPos: Record<string, NodePosition> = {};
    characters.forEach((char, index) => {
      // If position already exists, preserve it
      if (positions[char.id]) {
        initialPos[char.id] = positions[char.id];
        return;
      }

      const angle = (index / characters.length) * 2 * Math.PI - Math.PI / 2;
      initialPos[char.id] = {
        x: Math.round(centerX + radius * Math.cos(angle)),
        y: Math.round(centerY + radius * Math.sin(angle)),
      };
    });

    setPositions(initialPos);
  }, [characters.length]);

  // Open modal if triggered externally
  useEffect(() => {
    if (externalOpenAddModalTrigger && externalOpenAddModalTrigger > 0) {
      if (characters.length >= 2) {
        setShowAddModal(true);
      }
    }
  }, [externalOpenAddModalTrigger, characters.length]);

  // Recalculate layout
  const handleResetLayout = () => {
    const width = 800;
    const height = 550;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 100;

    const newPos: Record<string, NodePosition> = {};
    characters.forEach((char, index) => {
      const angle = (index / characters.length) * 2 * Math.PI - Math.PI / 2;
      newPos[char.id] = {
        x: Math.round(centerX + radius * Math.cos(angle)),
        y: Math.round(centerY + radius * Math.sin(angle)),
      };
    });
    setPositions(newPos);
  };

  // Node Dragging logic
  const handleMouseDown = (e: React.MouseEvent, charId: string) => {
    e.stopPropagation();
    const currentPos = positions[charId] || { x: 400, y: 300 };
    setDraggingNodeId(charId);

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      setDragOffset({
        x: clickX - currentPos.x,
        y: clickY - currentPos.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingNodeId || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(60, Math.min(740, e.clientX - rect.left - dragOffset.x));
    const y = Math.max(60, Math.min(490, e.clientY - rect.top - dragOffset.y));

    setPositions((prev) => ({
      ...prev,
      [draggingNodeId]: { x, y },
    }));
  };

  const handleMouseUp = () => {
    setDraggingNodeId(null);
  };

  // Touch Dragging logic for mobile screens
  const handleTouchStart = (e: React.TouchEvent, charId: string) => {
    e.stopPropagation();
    const touch = e.touches[0];
    if (!touch) return;
    const currentPos = positions[charId] || { x: 400, y: 300 };
    setDraggingNodeId(charId);

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const clickX = touch.clientX - rect.left;
      const clickY = touch.clientY - rect.top;
      setDragOffset({
        x: clickX - currentPos.x,
        y: clickY - currentPos.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!draggingNodeId || !containerRef.current) return;
    const touch = e.touches[0];
    if (!touch) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(60, Math.min(740, touch.clientX - rect.left - dragOffset.x));
    const y = Math.max(60, Math.min(490, touch.clientY - rect.top - dragOffset.y));

    setPositions((prev) => ({
      ...prev,
      [draggingNodeId]: { x, y },
    }));
  };

  const handleTouchEnd = () => {
    setDraggingNodeId(null);
  };

  // Relationship styling config
  const getRelMeta = (type: RelationshipType) => {
    switch (type) {
      case 'friend':
        return {
          label: 'صداقة / تحالف',
          color: '#10b981', // Emerald
          badgeBg: 'bg-emerald-100 text-emerald-950 border-emerald-300',
          strokeClass: 'stroke-emerald-500',
          dash: 'none',
          icon: Shield,
        };
      case 'enemy':
        return {
          label: 'عداوة / صراع',
          color: '#ef4444', // Red
          badgeBg: 'bg-red-100 text-red-950 border-red-300',
          strokeClass: 'stroke-red-500',
          dash: 'none',
          icon: Swords,
        };
      case 'family':
        return {
          label: 'عائلة / قرابة',
          color: '#f59e0b', // Amber
          badgeBg: 'bg-amber-100 text-amber-950 border-amber-300',
          strokeClass: 'stroke-amber-500',
          dash: '6 4',
          icon: Users,
        };
      case 'mentor':
        return {
          label: 'معلم / مرشد',
          color: '#8b5cf6', // Purple
          badgeBg: 'bg-purple-100 text-purple-950 border-purple-300',
          strokeClass: 'stroke-purple-500',
          dash: 'none',
          icon: GraduationCap,
        };
      case 'rival':
        return {
          label: 'منافسة / تنازع',
          color: '#f97316', // Orange
          badgeBg: 'bg-orange-100 text-orange-950 border-orange-300',
          strokeClass: 'stroke-orange-500',
          dash: '5 3',
          icon: Flame,
        };
      case 'love':
        return {
          label: 'عاطفة / حب',
          color: '#ec4899', // Pink
          badgeBg: 'bg-pink-100 text-pink-950 border-pink-300',
          strokeClass: 'stroke-pink-500',
          dash: 'none',
          icon: Heart,
        };
      case 'secret':
      default:
        return {
          label: 'علاقة سرية / لغز',
          color: '#64748b', // Slate
          badgeBg: 'bg-slate-100 text-slate-900 border-slate-300',
          strokeClass: 'stroke-slate-500',
          dash: '4 4',
          icon: KeyRound,
        };
    }
  };

  // Filtered relationships
  const filteredRelationships = useMemo(() => {
    return relationships.filter((rel) => {
      if (activeFilter !== 'all' && rel.type !== activeFilter) return false;
      return true;
    });
  }, [relationships, activeFilter]);

  // Check if a relationship or node is highlighted
  const isRelHighlighted = (rel: CharacterRelationship) => {
    if (!hoveredNodeId) return true;
    return rel.sourceId === hoveredNodeId || rel.targetId === hoveredNodeId;
  };

  const isNodeHighlighted = (charId: string) => {
    if (!hoveredNodeId) return true;
    if (charId === hoveredNodeId) return true;
    return relationships.some(
      (r) =>
        (r.sourceId === hoveredNodeId && r.targetId === charId) ||
        (r.targetId === hoveredNodeId && r.sourceId === charId)
    );
  };

  // Save new or edited relationship
  const handleSaveRelationship = () => {
    if (!sourceId || !targetId || sourceId === targetId || !relLabel.trim()) return;

    if (editingRel) {
      const updated = relationships.map((r) =>
        r.id === editingRel.id
          ? {
              ...r,
              sourceId,
              targetId,
              type: relType,
              label: relLabel.trim(),
              notes: relNotes.trim(),
            }
          : r
      );
      onUpdateRelationships(updated);
    } else {
      const newRel: CharacterRelationship = {
        id: `rel-${Date.now()}`,
        sourceId,
        targetId,
        type: relType,
        label: relLabel.trim(),
        notes: relNotes.trim(),
      };
      onUpdateRelationships([...relationships, newRel]);
    }

    setShowAddModal(false);
    setEditingRel(null);
    setRelLabel('');
    setRelNotes('');
  };

  const handleDeleteRelationship = (id: string) => {
    onUpdateRelationships(relationships.filter((r) => r.id !== id));
    setEditingRel(null);
  };

  const openAddModal = (defaultSource?: string) => {
    setEditingRel(null);
    setSourceId(defaultSource || characters[0]?.id || '');
    setTargetId(characters.find((c) => c.id !== defaultSource)?.id || '');
    setRelType('friend');
    setRelLabel('');
    setRelNotes('');
    setShowAddModal(true);
  };

  const openEditModal = (rel: CharacterRelationship) => {
    setEditingRel(rel);
    setSourceId(rel.sourceId);
    setTargetId(rel.targetId);
    setRelType(rel.type);
    setRelLabel(rel.label);
    setRelNotes(rel.notes || '');
    setShowAddModal(true);
  };

  // AI Suggestion for Relationships
  const handleAISuggestRelationships = async () => {
    if (characters.length < 2) return;
    setIsGeneratingAI(true);
    setAiError(null);

    try {
      const charDescriptions = characters
        .map((c) => `- ${c.name} (${c.role}): ${c.archetype}, الهدف: ${c.externalGoal}`)
        .join('\n');

      const prompt = `اقترح شبكة علاقات درامية مشوقة ومترابطة بين شخصيات الرواية التالية:
الرواية: "${novelTitle}"
النوع: "${genre}"
الشخصيات:
${charDescriptions}

المطلوب اقتراح 4 إلى 6 علاقات درامية قوية (صداقة، عداوة، قرابة، معلم وتلميذ، أو سر مخفي) تزيد من التوتر والحبكة.
أعد المخرجات بصيغة JSON حصراً، كقائمة تحتوي على العناصر التالية:
[
  {
    "sourceName": "اسم الشخصية الأولى بدقة",
    "targetName": "اسم الشخصية الثانية بدقة",
    "type": "friend أو enemy أو family أو mentor أو rival أو love أو secret",
    "label": "وصف موجز للعلاقة (مثل: حليف سري، عداوة دموية، أخت كبرى)",
    "notes": "تفصيل سردي موجز عن سبب هذه العلاقة وتأثيرها"
  }
]`;

      const response = await requestAIAssist({
        action: 'custom_prompt',
        context: {
          novelTitle,
          genre,
          instructions: prompt,
        },
      });

      let parsed: any[] = [];
      try {
        parsed = JSON.parse(response);
      } catch {
        const match = response.match(/\[[\s\S]*\]/);
        if (match) parsed = JSON.parse(match[0]);
      }

      const newRels: CharacterRelationship[] = [];
      parsed.forEach((item, idx) => {
        const src = characters.find((c) => c.name.includes(item.sourceName) || item.sourceName.includes(c.name));
        const tgt = characters.find((c) => c.name.includes(item.targetName) || item.targetName.includes(c.name));

        if (src && tgt && src.id !== tgt.id) {
          newRels.push({
            id: `ai-rel-${Date.now()}-${idx}`,
            sourceId: src.id,
            targetId: tgt.id,
            type: (item.type as RelationshipType) || 'friend',
            label: item.label || 'علاقة روائية',
            notes: item.notes || '',
          });
        }
      });

      if (newRels.length > 0) {
        onUpdateRelationships([...relationships, ...newRels]);
      }
    } catch (err: any) {
      setAiError(err.message || 'حدث خطأ أثناء اقتراح العلاقات.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const getCharById = (id: string) => characters.find((c) => c.id === id);

  return (
    <div className="bg-white rounded-3xl border border-stone-200 shadow-xs p-6 space-y-5 select-none">
      {/* Top Header & Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-800 flex items-center justify-center">
              <Compass className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base text-stone-900 font-novel-amiri">
              شبكة وخريطة العلاقات التفاعلية
            </h3>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            خريطة بصرية ديناميكية تربط شخصيات الرواية (تحالفات، عداوات، روابط عائلية، وأسرار دفينة)
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleAISuggestRelationships}
            disabled={isGeneratingAI || characters.length < 2}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100/80 border border-amber-300 text-amber-900 text-xs font-medium transition-colors shadow-2xs disabled:opacity-50"
            title="اقتراح علاقات درامية مشوقة بالذكاء الاصطناعي"
          >
            {isGeneratingAI ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-700" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            )}
            <span>اقتراح علاقات ذكية</span>
          </button>

          <button
            onClick={handleResetLayout}
            className="p-1.5 rounded-lg border border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors"
            title="إعادة توزيع الشخصيات دائرياً"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => openAddModal()}
            disabled={characters.length < 2}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white text-xs font-medium transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة علاقة</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between text-xs flex-wrap gap-2">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px]">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1 rounded-lg transition-colors font-medium ${
              activeFilter === 'all'
                ? 'bg-stone-900 text-white shadow-2xs'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            كافة العلاقات ({relationships.length})
          </button>

          {(['friend', 'enemy', 'family', 'mentor', 'rival', 'love', 'secret'] as RelationshipType[]).map((type) => {
            const meta = getRelMeta(type);
            const count = relationships.filter((r) => r.type === type).length;
            if (count === 0 && activeFilter !== type) return null;

            return (
              <button
                key={type}
                onClick={() => setActiveFilter(type)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-colors ${
                  activeFilter === type
                    ? `${meta.badgeBg} font-semibold shadow-2xs`
                    : 'border-transparent text-stone-600 hover:bg-stone-100'
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.color }} />
                <span>{meta.label}</span>
                <span className="opacity-60 text-[10px]">({count})</span>
              </button>
            );
          })}
        </div>

        <span className="text-[11px] text-stone-500 font-novel-amiri">
          اسحب الشخصيات لترتيب الخريطة، وانقر على وسام الرابط لتعديل العلاقة
        </span>
      </div>

      {aiError && (
        <div className="p-3 bg-red-50 text-red-800 border border-red-200 rounded-xl text-xs">
          {aiError}
        </div>
      )}

      {/* SVG Canvas Area */}
      {characters.length < 2 ? (
        <div className="py-24 text-center text-xs text-stone-400 space-y-2 border border-dashed border-stone-200 rounded-2xl">
          <Users className="w-10 h-10 mx-auto opacity-30 text-stone-600" />
          <p>أضف شخصيتين على الأقل في الرواية لبناء شبكة العلاقات</p>
        </div>
      ) : (
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="relative w-full h-[550px] bg-gradient-to-b from-[#fdfbf7] to-[#f7f4ed] rounded-2xl border border-stone-200 overflow-hidden shadow-inner cursor-default touch-none"
        >
          {/* Subtle background grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(#1c1917 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* SVG Connections Layer */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <defs>
              {/* Arrow markers for directed lines */}
              <marker
                id="arrow-friend"
                viewBox="0 0 10 10"
                refX="24"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" />
              </marker>
              <marker
                id="arrow-enemy"
                viewBox="0 0 10 10"
                refX="24"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
              </marker>
              <marker
                id="arrow-default"
                viewBox="0 0 10 10"
                refX="24"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#888" />
              </marker>
            </defs>

            {filteredRelationships.map((rel) => {
              const srcPos = positions[rel.sourceId];
              const tgtPos = positions[rel.targetId];
              if (!srcPos || !tgtPos) return null;

              const meta = getRelMeta(rel.type);
              const highlighted = isRelHighlighted(rel);
              const isHovered = hoveredRelId === rel.id;

              // Compute mid point
              const midX = (srcPos.x + tgtPos.x) / 2;
              const midY = (srcPos.y + tgtPos.y) / 2;

              // Curved control point
              const dx = tgtPos.x - srcPos.x;
              const dy = tgtPos.y - srcPos.y;
              const curveFactor = 0.15;
              const cx = midX - dy * curveFactor;
              const cy = midY + dx * curveFactor;

              const pathD = `M ${srcPos.x} ${srcPos.y} Q ${cx} ${cy} ${tgtPos.x} ${tgtPos.y}`;

              return (
                <g key={rel.id} className="transition-opacity duration-200">
                  {/* Background halo for hover visibility */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke="transparent"
                    strokeWidth="18"
                    className="pointer-events-auto cursor-pointer"
                    onMouseEnter={() => setHoveredRelId(rel.id)}
                    onMouseLeave={() => setHoveredRelId(null)}
                    onClick={() => openEditModal(rel)}
                  />

                  {/* Connecting Line */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={meta.color}
                    strokeWidth={isHovered ? 3.5 : highlighted ? 2 : 1}
                    strokeDasharray={meta.dash}
                    strokeOpacity={highlighted ? (isHovered ? 1 : 0.85) : 0.15}
                    markerEnd={`url(#arrow-${rel.type === 'enemy' ? 'enemy' : rel.type === 'friend' ? 'friend' : 'default'})`}
                    className="transition-all"
                  />
                </g>
              );
            })}
          </svg>

          {/* HTML Overlay for Midpoint Relationship Badges */}
          {filteredRelationships.map((rel) => {
            const srcPos = positions[rel.sourceId];
            const tgtPos = positions[rel.targetId];
            if (!srcPos || !tgtPos) return null;

            const meta = getRelMeta(rel.type);
            const highlighted = isRelHighlighted(rel);
            const isHovered = hoveredRelId === rel.id;

            const midX = (srcPos.x + tgtPos.x) / 2;
            const midY = (srcPos.y + tgtPos.y) / 2;
            const dx = tgtPos.x - srcPos.x;
            const dy = tgtPos.y - srcPos.y;
            const curveFactor = 0.15;
            const labelX = midX - dy * curveFactor * 0.7;
            const labelY = midY + dx * curveFactor * 0.7;

            const IconComponent = meta.icon;

            return (
              <div
                key={`badge-${rel.id}`}
                style={{
                  left: `${labelX}px`,
                  top: `${labelY}px`,
                  transform: 'translate(-50%, -50%)',
                }}
                className={`absolute z-10 transition-all duration-200 ${
                  highlighted ? 'opacity-100' : 'opacity-20 pointer-events-none'
                }`}
                onMouseEnter={() => setHoveredRelId(rel.id)}
                onMouseLeave={() => setHoveredRelId(null)}
              >
                <button
                  onClick={() => openEditModal(rel)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border shadow-xs hover:scale-105 transition-all font-novel-amiri ${meta.badgeBg} ${
                    isHovered ? 'ring-2 ring-stone-900 scale-105' : ''
                  }`}
                  title={`${rel.label} - انقر لتعديل أو حذف الرابط`}
                >
                  <IconComponent className="w-3 h-3 shrink-0" />
                  <span>{rel.label}</span>
                </button>
              </div>
            );
          })}

          {/* Character Nodes */}
          {characters.map((char) => {
            const pos = positions[char.id] || { x: 400, y: 300 };
            const isHovered = hoveredNodeId === char.id;
            const highlighted = isNodeHighlighted(char.id);
            const isDragging = draggingNodeId === char.id;

            const connectedCount = relationships.filter(
              (r) => r.sourceId === char.id || r.targetId === char.id
            ).length;

            return (
              <div
                key={char.id}
                style={{
                  left: `${pos.x}px`,
                  top: `${pos.y}px`,
                  transform: 'translate(-50%, -50%)',
                }}
                onMouseDown={(e) => handleMouseDown(e, char.id)}
                onTouchStart={(e) => handleTouchStart(e, char.id)}
                onMouseEnter={() => setHoveredNodeId(char.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
                className={`absolute z-20 cursor-grab active:cursor-grabbing select-none transition-transform duration-100 ${
                  isDragging ? 'scale-110 z-30' : isHovered ? 'scale-105 z-30' : ''
                } ${highlighted ? 'opacity-100' : 'opacity-30'}`}
              >
                <div className="flex flex-col items-center group">
                  {/* Node Circle */}
                  <div
                    className="w-13 h-13 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-md border-2 border-white relative transition-shadow group-hover:shadow-lg"
                    style={{ backgroundColor: char.color || '#d97706' }}
                  >
                    <span>{char.name ? char.name[0] : '؟'}</span>

                    {/* Connected count badge */}
                    {connectedCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-stone-900 text-white font-mono text-[10px] flex items-center justify-center border border-white">
                        {connectedCount}
                      </span>
                    )}
                  </div>

                  {/* Label card under node */}
                  <div className="mt-1.5 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-xl shadow-xs border border-stone-200/80 text-center max-w-[120px] pointer-events-none">
                    <p className="font-bold text-xs text-stone-900 font-novel-amiri truncate leading-tight">
                      {char.name}
                    </p>
                    <p className="text-[10px] text-stone-500 truncate leading-tight mt-0.5">
                      {char.archetype || char.role}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Legend and Summary bar */}
      <div className="flex items-center justify-between text-xs text-stone-600 pt-2 border-t border-stone-100 flex-wrap gap-2">
        <div className="flex items-center gap-4 flex-wrap text-[11px]">
          <span className="font-semibold text-stone-700">دليل الخطوط:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-1 bg-emerald-500 rounded-sm" />
            <span>صداقة وتحالف</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-1 bg-red-500 rounded-sm" />
            <span>عداوة وصراع</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-1 border-t-2 border-dashed border-amber-500" />
            <span>قرابة عائلية</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-1 bg-purple-500 rounded-sm" />
            <span>معلم / تلميذ</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-1 border-t-2 border-dotted border-slate-500" />
            <span>سر دفين</span>
          </div>
        </div>

        <span className="text-[11px] text-stone-400 font-mono">
          {relationships.length} روابط مسجلة
        </span>
      </div>

      {/* Add / Edit Relationship Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-stone-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-stone-200 text-xs">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-bold text-sm text-stone-900 font-novel-amiri">
                {editingRel ? 'تعديل علاقة الشخصيتين' : 'ربط علاقة درامية جديدة'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingRel(null);
                }}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Select Characters */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-stone-700 mb-1">من الشخصية الأولى</label>
                <select
                  value={sourceId}
                  onChange={(e) => setSourceId(e.target.value)}
                  className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-hidden focus:border-amber-400 font-novel-amiri"
                >
                  {characters.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">إلى الشخصية الثانية</label>
                <select
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-hidden focus:border-amber-400 font-novel-amiri"
                >
                  {characters.map((c) => (
                    <option key={c.id} value={c.id} disabled={c.id === sourceId}>
                      {c.name} ({c.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Relationship Type Selector */}
            <div>
              <label className="block font-medium text-stone-700 mb-1.5">نوع العلاقة</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {(['friend', 'enemy', 'family', 'mentor', 'rival', 'love', 'secret'] as RelationshipType[]).map((type) => {
                  const meta = getRelMeta(type);
                  const IconComp = meta.icon;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setRelType(type)}
                      className={`flex items-center gap-1.5 p-2 rounded-lg border text-[11px] font-medium transition-colors ${
                        relType === type
                          ? `${meta.badgeBg} font-bold ring-1 ring-stone-900`
                          : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      <IconComp className="w-3.5 h-3.5" />
                      <span>{meta.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Label input */}
            <div>
              <label className="block font-medium text-stone-700 mb-1">
                عنوان ومسمى العلاقة *
              </label>
              <input
                type="text"
                value={relLabel}
                onChange={(e) => setRelLabel(e.target.value)}
                placeholder="مثال: حليف سري، أخت كبرى، عداوة دموية، معلم الخط..."
                className="w-full p-2.5 border border-stone-200 rounded-lg text-xs focus:outline-hidden focus:border-amber-400 font-novel-amiri"
              />
            </div>

            {/* Notes input */}
            <div>
              <label className="block font-medium text-stone-700 mb-1">
                تفاصيل وخلفية العلاقة (اختياري)
              </label>
              <textarea
                value={relNotes}
                onChange={(e) => setRelNotes(e.target.value)}
                rows={3}
                placeholder="كيف بدأت هذه العلاقة؟ ما هو التوتر أو السر الذي يجمعهما؟..."
                className="w-full p-2.5 border border-stone-200 rounded-lg text-xs focus:outline-hidden focus:border-amber-400"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-stone-100">
              {editingRel ? (
                <button
                  onClick={() => handleDeleteRelationship(editingRel.id)}
                  className="flex items-center gap-1 px-3 py-1.5 text-red-600 hover:text-red-800 rounded-lg hover:bg-red-50 text-xs transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>حذف العلاقة</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingRel(null);
                  }}
                  className="px-3.5 py-1.5 rounded-lg text-stone-600 hover:bg-stone-100 text-xs font-medium"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSaveRelationship}
                  disabled={!relLabel.trim() || sourceId === targetId}
                  className="px-4 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white text-xs font-medium shadow-xs"
                >
                  {editingRel ? 'حفظ التعديل' : 'إضافة الرابط'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
