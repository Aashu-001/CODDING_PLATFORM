import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axiosClient from '../utils/axiosClient';
import { ArrowLeft } from 'lucide-react';
import { NavLink } from 'react-router';

const problemSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  tags: z.enum(['array', 'linkedList', 'graph', 'dp']),
  visibleTestCases: z
    .array(
      z.object({
        input: z.string().min(1, 'Input is required'),
        output: z.string().min(1, 'Output is required'),
        explanation: z.string().min(1, 'Explanation is required')
      })
    )
    .min(1, 'At least one visible test case required'),
  hiddenTestCases: z
    .array(
      z.object({
        input: z.string().optional(),
        output: z.string().optional()
      })
    )
    .optional(),
  startCode: z
    .array(
      z.object({
        language: z.enum(['C++', 'Java', 'JavaScript']),
        initialCode: z.string().min(1, 'Initial code is required')
      })
    )
    .length(3, 'All three languages required'),
  referenceSolution: z
    .array(
      z.object({
        language: z.enum(['C++', 'Java', 'JavaScript']),
        completeCode: z.string().min(1, 'Complete code is required')
      })
    )
    .length(3, 'All three languages required')
});

const defaultValues = {
  title: '',
  description: '',
  difficulty: 'easy',
  tags: 'array',
  visibleTestCases: [{ input: '', output: '', explanation: '' }],
  hiddenTestCases: [],
  startCode: [
    { language: 'C++', initialCode: '' },
    { language: 'Java', initialCode: '' },
    { language: 'JavaScript', initialCode: '' }
  ],
  referenceSolution: [
    { language: 'C++', completeCode: '' },
    { language: 'Java', completeCode: '' },
    { language: 'JavaScript', completeCode: '' }
  ]
};

const normalizeLanguageBlock = (items, key) => {
  const seed = {
    'C++': '',
    Java: '',
    JavaScript: ''
  };

  (items || []).forEach((item) => {
    if (seed[item.language] !== undefined) {
      seed[item.language] = item[key] || '';
    }
  });

  return [
    { language: 'C++', [key]: seed['C++'] },
    { language: 'Java', [key]: seed.Java },
    { language: 'JavaScript', [key]: seed.JavaScript }
  ];
};

const AdminUpdate = () => {
  const [problems, setProblems] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [selectedProblemId, setSelectedProblemId] = useState(null);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(problemSchema),
    defaultValues
  });

  const {
    fields: visibleFields,
    append: appendVisible,
    remove: removeVisible
  } = useFieldArray({
    control,
    name: 'visibleTestCases'
  });

  const {
    fields: hiddenFields,
    append: appendHidden,
    remove: removeHidden
  } = useFieldArray({
    control,
    name: 'hiddenTestCases'
  });

  const fetchProblems = async () => {
    try {
      setListLoading(true);
      setError(null);
      const { data } = await axiosClient.get('/problem/getAllProblem');
      setProblems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Failed to fetch problems');
      console.error(err);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    fetchProblems();
  }, []);

  const handleSelectProblem = async (problemId) => {
    try {
      setFormLoading(true);
      setError(null);
      const { data } = await axiosClient.get(`/problem/problemById/${problemId}`);

      reset({
        title: data.title || '',
        description: data.description || '',
        difficulty: (data.difficulty || 'easy').toLowerCase(),
        tags: data.tags || 'array',
        visibleTestCases:
          data.visibleTestCases?.length > 0
            ? data.visibleTestCases
            : [{ input: '', output: '', explanation: '' }],
        hiddenTestCases: Array.isArray(data.hiddenTestCases) ? data.hiddenTestCases : [],
        startCode: normalizeLanguageBlock(data.startCode, 'initialCode'),
        referenceSolution: normalizeLanguageBlock(data.referenceSolution, 'completeCode')
      });

      setSelectedProblemId(problemId);
    } catch (err) {
      setError('Failed to fetch selected problem details');
      console.error(err);
    } finally {
      setFormLoading(false);
    }
  };

  const onSubmit = async (payload) => {
    if (!selectedProblemId) return;

    const cleanedHidden = (payload.hiddenTestCases || []).filter(
      (testCase) => testCase?.input?.trim() && testCase?.output?.trim()
    );

    const updatePayload = { ...payload };

    if (cleanedHidden.length > 0) {
      updatePayload.hiddenTestCases = cleanedHidden;
    } else {
      delete updatePayload.hiddenTestCases;
    }

    try {
      setSubmitting(true);
      setError(null);
      await axiosClient.put(`/problem/update/${selectedProblemId}`, updatePayload);
      alert('Problem updated successfully!');
      await fetchProblems();
      setSelectedProblemId(null);
      reset(defaultValues);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update problem');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (listLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl p-4 md:p-6 space-y-4">
      {!selectedProblemId && (
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-3xl font-bold">Update Problems</h1>
          <NavLink to="/admin" className="btn btn-outline btn-sm">
            Back to Admin Panel
          </NavLink>
        </div>
      )}

      {error && (
        <div className="alert alert-error shadow-lg">
          <span>{error}</span>
        </div>
      )}

      {!selectedProblemId ? (
        <div className="overflow-x-auto card bg-base-100 shadow-lg p-4">
          {problems.length === 0 && (
            <div className="alert">
              <span>No problems found to update.</span>
            </div>
          )}
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th className="w-1/12">#</th>
                <th className="w-4/12">Title</th>
                <th className="w-2/12">Difficulty</th>
                <th className="w-3/12">Tags</th>
                <th className="w-2/12">Actions</th>
              </tr>
            </thead>
            <tbody>
              {problems.map((problem, index) => (
                <tr key={problem._id}>
                  <th>{index + 1}</th>
                  <td>{problem.title}</td>
                  <td>
                    <span
                      className={`badge ${
                        problem.difficulty === 'Easy'
                          ? 'badge-success'
                          : problem.difficulty === 'Medium'
                            ? 'badge-warning'
                            : 'badge-error'
                      }`}
                    >
                      {problem.difficulty}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-outline">{problem.tags}</span>
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => handleSelectProblem(problem._id)}
                      className="btn btn-sm btn-warning"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-3xl font-bold tracking-tight">Edit Problem</h2>
            <button
              type="button"
              className="btn btn-ghost btn-sm text-base-content/70 hover:text-base-content"
              onClick={() => {
                setSelectedProblemId(null);
                reset(defaultValues);
              }}
            >
              <ArrowLeft size={16} />
              Back to List
            </button>
          </div>

          {formLoading ? (
            <div className="flex justify-center items-center h-40">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : (
            <>
              <div className="card bg-base-100 shadow-2xl shadow-black/30 border border-base-300/40 p-5">
                <h3 className="text-xl font-semibold mb-3">Basic Information</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-[10rem_minmax(0,1fr)] items-start gap-2 md:gap-4">
                    <label className="md:pt-2 text-base-content/80">Title</label>
                    <div>
                      <input {...register('title')} className={`input input-bordered w-full ${errors.title ? 'input-error' : ''}`} />
                      {errors.title && <span className="text-error">{errors.title.message}</span>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-[10rem_minmax(0,1fr)] items-start gap-2 md:gap-4">
                    <label className="md:pt-2 text-base-content/80">Description</label>
                    <div>
                      <textarea {...register('description')} className={`textarea textarea-bordered h-32 w-full ${errors.description ? 'textarea-error' : ''}`} />
                      {errors.description && <span className="text-error">{errors.description.message}</span>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-[10rem_minmax(0,1fr)] items-start gap-2 md:gap-4">
                    <label className="md:pt-2 text-base-content/80">Difficulty</label>
                    <select {...register('difficulty')} className={`select select-bordered w-full ${errors.difficulty ? 'select-error' : ''}`}>
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-[10rem_minmax(0,1fr)] items-start gap-2 md:gap-4">
                    <label className="md:pt-2 text-base-content/80">Tag</label>
                    <select {...register('tags')} className={`select select-bordered w-full ${errors.tags ? 'select-error' : ''}`}>
                      <option value="array">Array</option>
                      <option value="linkedList">Linked List</option>
                      <option value="graph">Graph</option>
                      <option value="dp">DP</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="card bg-base-100 shadow-2xl shadow-black/30 border border-base-300/40 p-5">
                <h3 className="text-xl font-semibold mb-4">Test Cases</h3>

                <div className="space-y-4 mb-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Visible Test Cases</h4>
                    <button type="button" onClick={() => appendVisible({ input: '', output: '', explanation: '' })} className="btn btn-sm btn-primary">Add Visible</button>
                  </div>
                  {visibleFields.map((field, index) => (
                    <div key={field.id} className="card bg-base-200 p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input {...register(`visibleTestCases.${index}.input`)} placeholder="Input" className={`input input-bordered ${errors.visibleTestCases?.[index]?.input ? 'input-error' : ''}`} />
                        <input {...register(`visibleTestCases.${index}.output`)} placeholder="Output" className={`input input-bordered ${errors.visibleTestCases?.[index]?.output ? 'input-error' : ''}`} />
                        <input {...register(`visibleTestCases.${index}.explanation`)} placeholder="Explanation" className={`input input-bordered ${errors.visibleTestCases?.[index]?.explanation ? 'input-error' : ''}`} />
                      </div>
                      {visibleFields.length > 1 && <button type="button" onClick={() => removeVisible(index)} className="btn btn-sm btn-error mt-2">Remove</button>}
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Hidden Test Cases</h4>
                    <button type="button" onClick={() => appendHidden({ input: '', output: '' })} className="btn btn-sm btn-primary">Add Hidden</button>
                  </div>
                  {hiddenFields.map((field, index) => (
                    <div key={field.id} className="card bg-base-200 p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input {...register(`hiddenTestCases.${index}.input`)} placeholder="Input" className={`input input-bordered ${errors.hiddenTestCases?.[index]?.input ? 'input-error' : ''}`} />
                        <input {...register(`hiddenTestCases.${index}.output`)} placeholder="Output" className={`input input-bordered ${errors.hiddenTestCases?.[index]?.output ? 'input-error' : ''}`} />
                      </div>
                      {hiddenFields.length > 1 && <button type="button" onClick={() => removeHidden(index)} className="btn btn-sm btn-error mt-2">Remove</button>}
                    </div>
                  ))}
                </div>
              </div>

              <div className="card bg-base-100 shadow-2xl shadow-black/30 border border-base-300/40 p-5">
                <h3 className="text-xl font-semibold mb-4">Starter Code</h3>
                <div className="space-y-4">
                {['C++', 'Java', 'JavaScript'].map((language, index) => (
                  <div key={language} className="grid grid-cols-1 md:grid-cols-[10rem_minmax(0,1fr)] items-start gap-2 md:gap-4">
                    <label className="md:pt-2 text-base-content/80">{language}</label>
                    <div>
                      <textarea
                        {...register(`startCode.${index}.initialCode`)}
                        className={`textarea textarea-bordered h-28 w-full text-left ${errors.startCode?.[index]?.initialCode ? 'textarea-error' : ''}`}
                      />
                      <input type="hidden" {...register(`startCode.${index}.language`)} value={language} />
                    </div>
                  </div>
                ))}
                </div>
              </div>

              <div className="card bg-base-100 shadow-2xl shadow-black/30 border border-base-300/40 p-5">
                <h3 className="text-xl font-semibold mb-4">Reference Solution</h3>
                <div className="space-y-4">
                {['C++', 'Java', 'JavaScript'].map((language, index) => (
                  <div key={language} className="grid grid-cols-1 md:grid-cols-[10rem_minmax(0,1fr)] items-start gap-2 md:gap-4">
                    <label className="md:pt-2 text-base-content/80">{language}</label>
                    <div>
                      <textarea
                        {...register(`referenceSolution.${index}.completeCode`)}
                        className={`textarea textarea-bordered h-28 w-full text-left ${errors.referenceSolution?.[index]?.completeCode ? 'textarea-error' : ''}`}
                      />
                      <input type="hidden" {...register(`referenceSolution.${index}.language`)} value={language} />
                    </div>
                  </div>
                ))}
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button type="submit" className={`btn btn-primary px-8 ${submitting ? 'loading' : ''}`} disabled={submitting}>
                  {submitting ? 'Updating...' : 'Update Problem'}
                </button>
              </div>
            </>
          )}
        </form>
      )}
    </div>
  );
};

export default AdminUpdate;