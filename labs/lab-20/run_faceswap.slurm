#!/bin/bash
#SBATCH --job-name=faceswap
#SBATCH --account=ds6042
#SBATCH --partition=gpu
#SBATCH --gres=gpu:1
#SBATCH --cpus-per-task=4
#SBATCH --mem=16G
#SBATCH --time=00:20:00
#SBATCH --output=faceswap-%j.out
#
# Micro deepfake face-swap on the UVA HPC cluster (Rivanna/Afton).
#   Submit:  sbatch run_faceswap.slurm
#   Watch:   squeue --me      then   tail -f faceswap-<jobid>.out
#   Result:  results.png in this directory (scp it to your laptop to view)
#
# PyTorch comes from the pre-built NGC container module -- nothing to pip install.

module load apptainer/1.4.5 pytorch/2.11.0

# --nv exposes the GPU to the container. Swap subjects with --a / --b (0-39).
apptainer exec --nv "$CONTAINERDIR/pytorch-2.11.0.sif" \
    python faceswap.py --a 7 --b 21 --steps 3000 --out results.png

echo "done -- results.png written. Copy it down with:"
echo "  scp $USER@login.hpc.virginia.edu:$(pwd)/results.png ."
